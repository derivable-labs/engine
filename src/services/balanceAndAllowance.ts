import {bn, getErc1155Token, getNormalAddress} from '../utils/helper';
import {ethers}                                from 'ethers';
import {Multicall}                             from 'ethereum-multicall';
import {CONFIGS}                               from '../utils/configs';
import {LARGE_VALUE}                           from '../utils/constant';
import BnAAbi                                  from '../abi/BnA.json'
import PoolAbi                                 from '../abi/Pool.json'
import {AllowancesType, BalancesType}          from '../types';

type BnAReturnType = { balances: BalancesType, allowances: AllowancesType }

type ConfigType = {
  chainId: number
  account?: string
  provider: ethers.providers.Provider
}

export class BnA {
  chainId: number
  account?: string
  provider: ethers.providers.Provider

  constructor(configs: ConfigType) {
    this.chainId = configs.chainId
    this.account = configs.account
    this.provider = configs.provider
  }

  async getBalanceAndAllowance({
    tokens
  }: any): Promise<BnAReturnType> {
    if (this.account) {
      const multicall = new Multicall({
        multicallCustomContractAddress: CONFIGS[this.chainId].multiCall,
        ethersProvider: this.provider,
        tryAggregate: true
      })
      const erc20Tokens = getNormalAddress(tokens)
      const erc1155Tokens = getErc1155Token(tokens)
      const multiCallRequest = this.getBnAMulticallRequest({
        erc20Tokens, erc1155Tokens
      })
      const { results } = await multicall.call(multiCallRequest)

      return this.parseBnAMultiRes(erc20Tokens, erc1155Tokens, results)
    }
    return { balances: {}, allowances: {} }
  }

  getBnAMulticallRequest({ erc20Tokens, erc1155Tokens }: {
    erc20Tokens: string[],
    erc1155Tokens: { [key: string]: string[] }
  }) {
    const request: any = [
      {
        reference: 'erc20',
        contractAddress: CONFIGS[this.chainId].bnA,
        abi: BnAAbi,
        calls: [{
          reference: 'bna', methodName: 'getBnA',
          methodParameters: [erc20Tokens, [this.account], [CONFIGS[this.chainId].router]]
        }]
      }
    ]

    for (const erc1155Address in erc1155Tokens) {
      const accounts = erc1155Tokens[erc1155Address].map(() => {
        return this.account
      })
      request.push(
        {
          reference: 'erc1155',
          contractAddress: erc1155Address,
          abi: PoolAbi,
          calls: [
            {
              reference: erc1155Address, methodName: 'isApprovedForAll',
              methodParameters: [this.account, CONFIGS[this.chainId].router]
            },
            {
              reference: erc1155Address, methodName: 'balanceOfBatch',
              methodParameters: [accounts, erc1155Tokens[erc1155Address]]
            }
          ]
        }
      )
    }

    return request
  }

  parseBnAMultiRes(erc20Address: any, erc1155Tokens: any, data: any): BnAReturnType {
    const balances: BalancesType = {}
    const allowances: AllowancesType = {}
    const erc20Info = data.erc20.callsReturnContext[0].returnValues[0]
    for (let i = 0; i < erc20Address.length; i++) {
      const address = erc20Address[i]
      balances[address] = bn(erc20Info[i * 2])
      allowances[address] = bn(erc20Info[i * 2 + 1])
    }

    const erc1155Info = data?.erc1155?.callsReturnContext
    if (erc1155Info) {
      const approveData = erc1155Info.filter((e: any) => e.methodName === 'isApprovedForAll')
      const balanceData = erc1155Info.filter((e: any) => e.methodName === 'balanceOfBatch')

      for (let i = 0; i < approveData.length; i++) {
        const callsReturnContext = approveData[i]
        allowances[callsReturnContext.reference] = callsReturnContext.returnValues[0] ? bn(LARGE_VALUE) : bn(0)
      }

      for (let i = 0; i < balanceData.length; i++) {
        const returnValues = balanceData[i].returnValues
        for (let j = 0; j < returnValues.length; j++) {
          const id = erc1155Tokens[balanceData[i].reference][j].toNumber()
          balances[balanceData[i].reference + '-' + id] = bn(returnValues[j])
        }
      }
    }

    return {
      balances,
      allowances
    }
  }
}
