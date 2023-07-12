import { bn, getErc1155Token, getNormalAddress, packId } from '../utils/helper'
import { ethers } from 'ethers'
import { Multicall } from 'ethereum-multicall'
import { LARGE_VALUE } from '../utils/constant'
import BnAAbi from '../abi/BnA.json'
import TokenAbi from '../abi/Token.json'
import PoolAbi from '../abi/Pool.json'
import { AllowancesType, BalancesType } from '../types'
import { ConfigType } from './setConfig'
import { DerivableContractAddress } from '../utils/configs'

type BnAReturnType = { balances: BalancesType; allowances: AllowancesType }

// type ConfigType = {
//   chainId: number
//   account?: string
//   provider: ethers.providers.Provider
// }

export class BnA {
  chainId: number
  account?: string
  provider: ethers.providers.Provider
  contractAddresses: Partial<DerivableContractAddress>
  constructor(config: ConfigType) {
    this.chainId = config.chainId
    this.account = config.account
    this.provider = config.provider
    this.contractAddresses = config.addresses
  }

  async getBalanceAndAllowance({ tokens }: any): Promise<BnAReturnType> {
    if (this.account) {
      const multicall = new Multicall({
        multicallCustomContractAddress: this.contractAddresses.multiCall,
        ethersProvider: this.provider,
        tryAggregate: true,
      })
      const erc20Tokens = getNormalAddress(tokens)
      const erc1155Tokens = getErc1155Token(tokens)
      const multiCallRequest = this.getBnAMulticallRequest({
        erc20Tokens,
        erc1155Tokens,
      })
      const { results } = await multicall.call(multiCallRequest)

      return this.parseBnAMultiRes(erc20Tokens, erc1155Tokens, results)
    }
    return { balances: {}, allowances: {} }
  }

  getBnAMulticallRequest({
    erc20Tokens,
    erc1155Tokens,
  }: {
    erc20Tokens: string[]
    erc1155Tokens: { [key: string]: string[] }
  }) {
    const pack = []
    const accounts = []
    for (const poolAddress in erc1155Tokens) {
      for (let side of erc1155Tokens[poolAddress]) {
        pack.push(packId(side, poolAddress))
        accounts.push(this.account)
      }
    }

    const request: any = [
      {
        reference: 'erc20',
        contractAddress: this.contractAddresses.bnA,
        abi: BnAAbi,
        calls: [
          {
            reference: 'bna',
            methodName: 'getBnA',
            methodParameters: [
              erc20Tokens,
              [this.account],
              [this.contractAddresses.router],
            ],
          },
        ],
      },
      {
        reference: 'erc1155',
        contractAddress: this.contractAddresses.token,
        abi: TokenAbi,
        calls: [
          {
            reference: 'balanceOfBatch',
            methodName: 'balanceOfBatch',
            methodParameters: [accounts, pack],
          },
          {
            reference: 'isApprovedForAll',
            methodName: 'isApprovedForAll',
            methodParameters: [this.account, this.contractAddresses.router],
          },
        ],
      },
    ]

    return request
  }

  parseBnAMultiRes(
    erc20Address: any,
    erc1155Tokens: any,
    data: any,
  ): BnAReturnType {
    const balances: BalancesType = {}
    const allowances: AllowancesType = {}
    const erc20Info = data.erc20.callsReturnContext[0].returnValues[0]
    for (let i = 0; i < erc20Address.length; i++) {
      const address = erc20Address[i]
      balances[address] = bn(erc20Info[i * 2])
      allowances[address] = bn(erc20Info[i * 2 + 1])
    }

    const erc1155BalanceInfo = data.erc1155.callsReturnContext[0].returnValues
    const erc1155ApproveInfo = data.erc1155.callsReturnContext[1].returnValues[0]

    let index = 0
    for (let poolAddress in erc1155Tokens) {
      for (let i = 0; i < erc1155Tokens[poolAddress].length; i++) {
        const key = poolAddress + '-' + erc1155Tokens[poolAddress][i].toString()
        allowances[key] = erc1155ApproveInfo ? bn(LARGE_VALUE) : bn(0)
        balances[key] = bn(erc1155BalanceInfo[index]?.hex ?? 0)
        ++index
      }
    }

    return {
      balances,
      allowances,
    }
  }
}
