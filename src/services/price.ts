import {ethers}                        from "ethers";
import {MINI_SECOND_PER_DAY, POOL_IDS} from "../utils/constant";
import {CONFIGS}                       from "../utils/configs";
import EventsAbi                       from "../abi/Events.json";
import {
  bn, div, formatPercent,
  numberToWei, sub, weiToNumber
}                                      from "../utils/helper";
import {TokenType}                     from "../types";
import historyProvider                 from "../historyProvider";
import PoolAbi                         from '../abi/Pool.json'
import {UniV2Pair}                     from "./uniV2Pair";

const SYNC_EVENT_TOPIC = '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'

type ConfigType = {
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  UNIV2PAIR: UniV2Pair
}

export class Price {
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  UNIV2PAIR: UniV2Pair

  constructor(configs: ConfigType) {
    this.chainId = configs.chainId
    this.scanApi = configs.scanApi
    this.provider = configs.provider
    this.providerToGetLog = configs.providerToGetLog
    this.UNIV2PAIR = configs.UNIV2PAIR
  }


  async get24hChangeByLog(
    {
      baseToken,
      quoteToken,
      cToken,
      currentPrice,
      baseId,
      headBlock,
      range = 40,
    }: {
      baseToken: TokenType,
      cToken: string,
      quoteToken: TokenType,
      currentPrice: string,
      baseId: number,
      headBlock?: number
      range?: number
    }): Promise<any> {
    try {
      if (!headBlock) {
        headBlock = await this.providerToGetLog.getBlockNumber()
      }

      const blocknumber24hAgo = headBlock - Math.floor(MINI_SECOND_PER_DAY / CONFIGS[this.chainId].timePerBlock)
      const eventInterface = new ethers.utils.Interface(EventsAbi)

      const { totalBaseReserve, totalQuoteReserve } = await this.providerToGetLog.getLogs({
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
        return await this.get24hChangeByLog({
          baseToken,
          quoteToken,
          cToken,
          currentPrice,
          baseId,
          headBlock,
          range: range * 2,
        })
      }
    } catch
      (e) {
      console.error(e)
      return 0
    }
  }

  async get24hChange({
      baseToken,
      cToken,
      quoteToken,
      chainId,
      currentPrice
    }: {
      baseToken: TokenType,
      cToken: string,
      chainId: string,
      quoteToken: TokenType,
      currentPrice: string
    }
  ) {
    try {
      const toTime = Math.floor((new Date().getTime() - MINI_SECOND_PER_DAY) / 1000)
      const result = await historyProvider.getBars({
        to: toTime,
        limit: 1,
        chainId,
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
   * @return price of native token
   */
  async getNativePrice(): Promise<string> {
    try {
      if (!CONFIGS[this.chainId].wrapUsdPair
      ) {
        return '0'
      }
      const res = await this.UNIV2PAIR.getPairInfo({
        pairAddress: CONFIGS[this.chainId].wrapUsdPair
      })
      const [wrapToken, usdToken] = res.token0.adr === CONFIGS[this.chainId].wrapToken ? [res.token0, res.token1] : [res.token1, res.token0]
      const priceWei = usdToken.reserve
                               .mul(numberToWei(1))
                               .div(wrapToken.reserve)
      return weiToNumber(priceWei, 18 + usdToken.decimals.toNumber() - wrapToken.decimals.toNumber())
    } catch
      (e) {
      console.error(e)
      return '0'
    }
  }

  async fetchCpPrice({
      states,
      cToken,
      poolAddress,
      cTokenPrice,
    }: {
      states: any
      cToken: string
      poolAddress: string
      cTokenPrice: number
    }
  ) {
    try {
      if (!poolAddress || !cToken || !cTokenPrice || !states) {
        return '0'
      }
      const contract = new ethers.Contract(poolAddress, PoolAbi, this.provider)
      const cpTotalSupply = await contract.totalSupply(POOL_IDS.cp)
      const rBc = states.Rc.sub(states.rDcNeutral).sub(states.rDcLong).sub(states.rDcShort)
      const p = bn(numberToWei(cTokenPrice)).mul(rBc).div(cpTotalSupply)
      return weiToNumber(p)
    } catch
      (e) {
      console.error(e)
      return '0'
    }
  }
}
