import {bn, getErc1155Token, getNormalAddress, packId} from '../utils/helper'
import {ethers} from 'ethers'
import {Multicall} from 'ethereum-multicall'
import {LARGE_VALUE} from '../utils/constant'
import BnAAbi from '../abi/BnA.json'
import TokenAbi from '../abi/Token.json'
import {AllowancesType, BalancesType, MaturitiesType} from '../types'
import {ConfigType} from './setConfig'
import {DerivableContractAddress} from '../utils/configs'
import {unpackId} from "../utils/number";
import {JsonRpcProvider} from "@ethersproject/providers";
import PairV3DetailAbi from "../abi/PairV3Detail.json";

type BnAReturnType = { balances: BalancesType; allowances: AllowancesType, maturity: MaturitiesType }

export class BnA {
  chainId: number
  account?: string
  provider: ethers.providers.Provider
  contractAddresses: Partial<DerivableContractAddress>
  rpcUrl: string

  constructor(config: ConfigType) {
    this.rpcUrl = config.rpcUrl
    this.chainId = config.chainId
    this.account = config.account
    this.provider = config.provider
    this.contractAddresses = config.addresses
  }

  async getBalanceAndAllowance({tokens}: any): Promise<BnAReturnType> {
    if (this.account) {

      const provider = new JsonRpcProvider(this.rpcUrl)
      // @ts-ignore
      provider.setStateOverride({
        [this.contractAddresses.bnA as string]: {
          code: BnAAbi.deployedBytecode,
        },
      })

      const multicall = new Multicall({
        multicallCustomContractAddress: this.contractAddresses.multiCall,
        ethersProvider: provider,
        tryAggregate: true,
      })
      const erc20Tokens = getNormalAddress(tokens)
      const erc1155Tokens = getErc1155Token(tokens)
      const multiCallRequest = this.getBnAMulticallRequest({
        erc20Tokens,
        erc1155Tokens,
      })
      const {results} = await multicall.call(multiCallRequest)

      return this.parseBnAMultiRes(erc20Tokens, erc1155Tokens, results)
    }
    return {balances: {}, allowances: {}, maturity: { }}
  }

  getBnAMulticallRequest({
                           erc20Tokens,
                           erc1155Tokens,
                         }: {
    erc20Tokens: string[]
    erc1155Tokens: { [key: string]: string[] }
  }) {
    const packs = []
    const accounts = []
    for (const poolAddress in erc1155Tokens) {
      for (let side of erc1155Tokens[poolAddress]) {
        packs.push(packId(side, poolAddress))
        accounts.push(this.account)
      }
    }

    const request: any = [
      {
        reference: 'erc20',
        contractAddress: this.contractAddresses.bnA,
        abi: BnAAbi.abi,
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
            methodParameters: [accounts, packs],
          },
          {
            reference: 'isApprovedForAll',
            methodName: 'isApprovedForAll',
            methodParameters: [this.account, this.contractAddresses.router],
          },
        ],
      },
    ]

    for (let pack of packs) {
      request[1].calls.push({
        reference: 'maturityOf-' + pack,
        methodName: 'maturityOf',
        methodParameters: [this.account, pack],
      })
    }

    return request
  }

  parseBnAMultiRes(
    erc20Address: any,
    erc1155Tokens: any,
    data: any,
  ): BnAReturnType {
    const maturity: MaturitiesType = {}
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

    for(let maturityIndex = 2; maturityIndex < data.erc1155.callsReturnContext.length; maturityIndex++) {
      const responseData = data.erc1155.callsReturnContext[maturityIndex]
      const {k, p} = unpackId(bn(responseData.reference?.split('-')[1]))
      maturity[p + '-' + Number(k)] = bn(responseData.returnValues[0]?.hex)
    }

    return {
      balances,
      allowances,
      maturity
    }
  }
}
