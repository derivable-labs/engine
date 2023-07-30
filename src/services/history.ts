import {BigNumber, ethers} from 'ethers'
import {PowerState} from 'powerLib/dist/powerLib'
import {LogType, TokenType} from '../types'
import {CurrentPool} from './currentPool'
import {EventDataAbis, NATIVE_ADDRESS, POOL_IDS} from '../utils/constant'
import {ConfigType} from './setConfig'
import {Resource} from './resource'
import {add, bn, div, getTopics, mul, numberToWei, parseSqrtSpotPrice, sub, weiToNumber} from "../utils/helper";

export class History {
  account?: string
  CURRENT_POOL: CurrentPool
  config: ConfigType

  constructor(config: ConfigType & { CURRENT_POOL: CurrentPool }) {
    this.config = config
    this.account = config.account
    this.CURRENT_POOL = config.CURRENT_POOL
  }

  generatePositions({tokens, logs}: { tokens: TokenType[], logs: LogType[] }) {
    try {
      if (!logs || logs.length === 0) {
        return []
      }

      let positions = {}
      logs = logs.sort((a, b) => a.blockNumber - b.blockNumber)
      logs.forEach((log: LogType) => {
        const abi = this.getSwapAbi(log.topics[0])
        const encodeData = ethers.utils.defaultAbiCoder.encode(
          abi,
          log.args.args,
        )
        const formatedData = ethers.utils.defaultAbiCoder.decode(
          abi,
          encodeData,
        )
        positions = this.generatePositionBySwapLog(positions, tokens, formatedData)
      })
      return positions
    } catch (e) {
      throw e
    }
  }

  generatePositionBySwapLog(positions: any, tokens: TokenType[], formatedData: any) {
    const pools = this.CURRENT_POOL.pools
    const poolAddresses = Object.keys(this.CURRENT_POOL.pools)

    const {poolIn, poolOut, sideIn, sideOut, amountOut, amountIn, priceR} = formatedData

    if (
      !poolAddresses.includes(poolIn) ||
      !poolAddresses.includes(poolOut)
    ) {
      return positions
    }

    const tokenIn = this.getTokenAddressByPoolAndSide(
      poolIn,
      formatedData.sideIn,
    )
    const tokenOut = this.getTokenAddressByPoolAndSide(
      poolOut,
      formatedData.sideOut,
    )

    if ([POOL_IDS.A, POOL_IDS.B, POOL_IDS.C].includes(sideOut.toNumber())) {
      if (!positions[tokenOut]) {
        positions[tokenOut] = {
          balance: amountOut,
          entry: 0
        }
      } else {
        positions[tokenOut].balance = positions[tokenOut].balance.add(amountOut)
      }
      if ([POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) && priceR) {
        const pool = pools[poolIn]
        const tokenR = tokens.find((t) => t.address === pool.TOKEN_R)
        const tokenRQuote = tokens.find((t) => t.address === this.config.stableCoins[0])
        const _tokenIn = tokens.find((t) => t.address === tokenIn)
        //@ts-ignore
        const price = parseSqrtSpotPrice(priceR, tokenR, tokenRQuote, 1)

        positions[tokenOut].entry = add(positions[tokenOut].entry, weiToNumber(amountIn.mul(numberToWei(price) || 0), 18 + (_tokenIn?.decimal || 18)))
      } else if (positions[tokenIn] && positions[tokenIn].entry) {
        const oldEntry = div(mul(positions[tokenIn].entry, amountIn),positions[tokenIn].balance)
        positions[tokenOut].entry = add(positions[tokenOut].entry, oldEntry)
      }
    }

    if ([POOL_IDS.A, POOL_IDS.B, POOL_IDS.C].includes(sideIn.toNumber())) {
      if (positions[tokenIn] && positions[tokenIn].entry) {
        const oldEntry = div(mul(positions[tokenIn].entry, amountIn), positions[tokenIn].balance)
        positions[tokenIn] = {
          balance: positions[tokenIn].balance.sub(amountIn),
          entry: sub(positions[tokenIn].entry, oldEntry),
        }
      }
    }
    return positions
  }

  formatSwapHistory({logs}: { logs: LogType[] }) {
    try {
      if (!logs || logs.length === 0) {
        return []
      }

      const poolAddresses = Object.keys(this.CURRENT_POOL.pools)
      const swapLogs = logs.map((log) => {
        const abi = this.getSwapAbi(log.topics[0])

        const encodeData = ethers.utils.defaultAbiCoder.encode(
          abi,
          log.args.args,
        )
        const formatedData = ethers.utils.defaultAbiCoder.decode(
          abi,
          encodeData,
        )

        const {poolIn, poolOut} = formatedData

        if (
          !poolAddresses.includes(poolIn) ||
          !poolAddresses.includes(poolOut)
        ) {
          return null
        }

        const tokenIn = this.getTokenAddressByPoolAndSide(
          poolIn,
          formatedData.sideIn,
        )
        const tokenOut = this.getTokenAddressByPoolAndSide(
          poolOut,
          formatedData.sideOut,
        )

        return {
          transactionHash: log.transactionHash,
          timeStamp: log.timeStamp,
          blockNumber: log.blockNumber,
          poolIn,
          poolOut,
          tokenIn,
          tokenOut,
          ...formatedData,
        }
      })

      //@ts-ignore
      return (
        swapLogs
          .filter((l) => l !== null)
          //@ts-ignore
          .sort((a, b) => b.blockNumber - a.blockNumber)
      )
    } catch (e) {
      throw e
    }
  }

  getTokenAddressByPoolAndSide(poolAddress: string, side: BigNumber) {
    const pool = this.CURRENT_POOL.pools[poolAddress]
    if (side.eq(POOL_IDS.native)) {
      return NATIVE_ADDRESS
    }
    if (side.eq(POOL_IDS.R)) {
      return pool?.TOKEN_R || NATIVE_ADDRESS
    }
    return poolAddress + '-' + side.toString()
  }

  getSwapAbi = (topic0: string) => {
    const topics = getTopics()
    if (topic0 === topics.Swap[0]) {
      return EventDataAbis.Swap
    } else if (topic0 === topics.Swap[1]) {
      return EventDataAbis.Swap1
    } else {
      return EventDataAbis.Swap2
    }
  }

  calculateLeverage(powerState: PowerState, balances: any, powers: number[]) {
    const _balances = {}
    for (let i in balances) {
      if (powers[i]) {
        _balances[powers[i]] = balances[i]
      }
    }
    return powerState.calculateCompExposure(_balances)
  }
}
