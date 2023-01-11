import {bn, getErc1155Token, getNormalAddress, provider} from "./utils/helper";
import {ethers}                                          from "ethers";
import {Multicall}                                       from "ethereum-multicall";
import {CONFIGS}                                         from "./utils/configs";
import {LARGE_VALUE}                                     from "./utils/constant";
import BnAAbi                                            from './abi/BnA.json'
import PoolAbi                                           from './abi/Pool.json'
import {AllowancesType, BalancesType}                    from "./types";

type ConfigType = {
  account: string
  tokens: string[]
  chainId: number
  rpcUrl: string
}

type BnAReturnType = { balances: BalancesType, allowances: AllowancesType }

export const getBalanceAndAllowance = async ({
  account, tokens, chainId, rpcUrl
}: ConfigType): Promise<BnAReturnType> => {
  if (account) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    const multicall = new Multicall({
      multicallCustomContractAddress: CONFIGS[chainId].multiCall,
      ethersProvider: provider,
      tryAggregate: true
    })
    const erc20Tokens = getNormalAddress(tokens)
    const erc1155Tokens = getErc1155Token(tokens)
    const multiCallRequest = getBnAMulticallRequest({ account, chainId, erc20Tokens, erc1155Tokens })
    const { results } = await multicall.call(multiCallRequest)

    return parseBnAMultiRes(erc20Tokens, erc1155Tokens, results)
  }
  return { balances: {}, allowances: {} }
}


const parseBnAMultiRes = (erc20Address: any, erc1155Tokens: any, data: any): BnAReturnType => {
  const balances: BalancesType = {}
  const allowances: AllowancesType = {}
  const erc20Info = data.erc20.callsReturnContext[0].returnValues[0]
  console.log({
    erc20Address,
    erc20Info
  })
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

const getBnAMulticallRequest = (
  {
    account,
    chainId,
    // @ts-ignore
    erc20Tokens,
    // @ts-ignore
    erc1155Tokens
  }: {
    account: string,
    chainId: number,
    erc20Tokens: string[],
    erc1155Tokens: { [key: string]: string[] }
  }) => {
  const request: any = [
    {
      reference: 'erc20',
      contractAddress: CONFIGS[chainId].bnA,
      abi: BnAAbi,
      calls: [{
        reference: 'bna', methodName: 'getBnA', methodParameters: [erc20Tokens, [account], [CONFIGS[chainId].router]]
      }]
    }
  ]

  for (const erc1155Address in erc1155Tokens) {
    const accounts = erc1155Tokens[erc1155Address].map(() => {
      return account
    })
    request.push(
      {
        reference: 'erc1155',
        contractAddress: erc1155Address,
        abi: PoolAbi,
        calls: [
          {
            reference: erc1155Address, methodName: 'isApprovedForAll',
            methodParameters: [account, CONFIGS[chainId].router]
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
