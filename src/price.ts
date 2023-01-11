import {ethers}                        from "ethers";
import {MINI_SECOND_PER_DAY, POOL_IDS} from "./utils/constant";
import {CONFIGS}                       from "./utils/configs";
import EventsAbi                       from "./abi/Events.json";
import {
  bn, div, formatPercent,
  numberToWei, sub, weiToNumber
}                                      from "./utils/helper";
import {TokenType}                     from "./types";
import historyProvider                 from "./historyProvider";
import {getPairInfo}                   from "./uniV2Pair";
import PoolAbi                         from './abi/Pool.json'

const SYNC_EVENT_TOPIC = '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'

export const get24hChangeByLog = async (
  {
    baseToken,
    quoteToken,
    cToken,
    currentPrice,
    baseId,
    headBlock,
    range = 40,
    chainId,
  }: {
    baseToken: TokenType,
    cToken: string,
    quoteToken: TokenType,
    currentPrice: string,
    baseId: number,
    headBlock?: number
    range?: number
    chainId: number
  }): Promise<any> => {
  try {
    const provider = new ethers.providers.StaticJsonRpcProvider(CONFIGS[chainId].rpcToGetLogs)
    if (!headBlock) {
      headBlock = await provider.getBlockNumber()
    }
    const blocknumber24hAgo = headBlock - Math.floor(MINI_SECOND_PER_DAY / CONFIGS[chainId].timePerBlock)
    const eventInterface = new ethers.utils.Interface(EventsAbi)

    const { totalBaseReserve, totalQuoteReserve } = await provider.getLogs({
      address: cToken,
      fromBlock: blocknumber24hAgo - range,
      toBlock: blocknumber24hAgo,
      topics: [SYNC_EVENT_TOPIC]
    }).then((logs) => {
      return logs.map((log) => {
        const data = eventInterface.parseLog(log)
        const [baseReserve, quoteReserve] = baseId === POOL_IDS.token0
          ? [data.args.reserve0, data.args.reserve1]
          : [data.args.reserve1, data.args.reserve0]
        return {
          baseReserve,
          quoteReserve
        }
      })
    }).then((reserves) => {
      let totalBaseReserve = bn(0)
      let totalQuoteReserve = bn(0)
      for (const i in reserves) {
        totalBaseReserve = totalBaseReserve.add(reserves[i].baseReserve)
        totalQuoteReserve = totalQuoteReserve.add(reserves[i].quoteReserve)
      }
      return { totalBaseReserve, totalQuoteReserve }
    })

    if (totalBaseReserve.gt(0) && totalQuoteReserve.gt(0)) {
      const price = weiToNumber(
        totalQuoteReserve.mul(numberToWei(1)).div(totalBaseReserve),
        18 + (quoteToken.decimal) - (baseToken.decimal)
      )

      return formatPercent(
        div(
          sub(currentPrice, price),
          price
        )
      )
    } else {
      return await get24hChangeByLog({
        baseToken,
        quoteToken,
        cToken,
        currentPrice,
        baseId,
        headBlock,
        range: range * 2,
        chainId
      })
    }
  } catch (e) {
    console.error(e)
    return 0
  }
}

export const get24hChange = async ({
  baseToken,
  cToken,
  quoteToken,
  currentPrice
}: {
  baseToken: TokenType,
  cToken: string,
  quoteToken: TokenType,
  currentPrice: string
}) => {
  try {
    const toTime = Math.floor((new Date().getTime() - MINI_SECOND_PER_DAY) / 1000)
    const result = await historyProvider.getBars({
      to: toTime,
      limit: 1,
      resolution: '1',
      route: `${baseToken.address}/${cToken}/${quoteToken.address}`,
      outputToken: quoteToken,
      inputToken: baseToken,
    })
    const beforePrice = result[0].open
    return formatPercent(
      div(
        sub(currentPrice, beforePrice),
        beforePrice
      )
    )
  } catch (e) {
    console.error(e)
    return 0
  }
}


/**
 * @param chainId
 * @return price of native token
 */
export const getNativePrice = async ({
  chainId
}: any): Promise<string> => {
  try {
    if (!CONFIGS[chainId].wrapUsdPair) {
      return '0'
    }
    const res = await getPairInfo({
      pairAddress: CONFIGS[chainId].wrapUsdPair,
      chainId,
      rpcUrl: CONFIGS[chainId].rpcUrl
    })
    const [wrapToken, usdToken] = res.token0.adr === CONFIGS[chainId].wrapToken ? [res.token0, res.token1] : [res.token1, res.token0]
    const priceWei = usdToken.reserve
                             .mul(numberToWei(1))
                             .div(wrapToken.reserve)
    return weiToNumber(priceWei, 18 + usdToken.decimals.toNumber() - wrapToken.decimals.toNumber())
  } catch (e) {
    console.error(e)
    return '0'
  }
}

export const fetchCpPrice = async ({
  states,
  cToken,
  poolAddress,
  cTokenPrice,
  chainId
}: {
  states: any
  cToken: string
  poolAddress: string
  cTokenPrice: number
  chainId: number
}) => {
  try {
    if (!poolAddress || !cToken || !cTokenPrice || !states) {
      return '0'
    }
    const provider = new ethers.providers.JsonRpcProvider(CONFIGS[chainId].rpcUrl)
    const contract = new ethers.Contract(poolAddress, PoolAbi, provider)
    const cpTotalSupply = await contract.totalSupply(POOL_IDS.cp)
    const rBc = states.Rc.sub(states.rDcNeutral).sub(states.rDcLong).sub(states.rDcShort)
    const p = bn(numberToWei(cTokenPrice)).mul(rBc).div(cpTotalSupply)
    return weiToNumber(p)
  } catch (e) {
    console.error(e)
    return '0'
  }
}
