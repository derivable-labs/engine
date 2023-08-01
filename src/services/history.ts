import {BigNumber, ethers} from 'ethers'
import {PowerState} from 'powerLib/dist/powerLib'
import {LogType, TokenType} from '../types'
import {CurrentPool} from './currentPool'
import {EventDataAbis, NATIVE_ADDRESS, POOL_IDS} from '../utils/constant'
import {ConfigType} from './setConfig'
import {Resource} from './resource'
import {add, bn, div, getTopics, mul, numberToWei, parseSqrtSpotPrice, sub, weiToNumber} from "../utils/helper";
import {forEach} from "lodash";

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

      for(let i in positions) {
        positions[i].entryPrice = positions[i].entry && positions[i].amountIn ? div(positions[i].entry, positions[i].amountIn) : 0
      }

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

    const tokenInAddress = this.getTokenAddressByPoolAndSide(
      poolIn,
      formatedData.sideIn,
    )
    const tokenOutAddress = this.getTokenAddressByPoolAndSide(
      poolOut,
      formatedData.sideOut,
    )
    const tokenIn = tokens.find((t) => t.address === tokenInAddress)

    if ([POOL_IDS.A, POOL_IDS.B, POOL_IDS.C].includes(sideOut.toNumber())) {
      if (!positions[tokenOutAddress]) {
        positions[tokenOutAddress] = {
          balance: amountOut,
          entry: 0,
          amountIn: 0,
        }
      } else {
        positions[tokenOutAddress].balance = positions[tokenOutAddress].balance.add(amountOut)
      }
      if ([POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) && priceR) {
        const pool = pools[poolIn]
        const tokenR = tokens.find((t) => t.address === pool.TOKEN_R)
        const tokenRQuote = tokens.find((t) => t.address === this.config.stableCoins[0])
        //@ts-ignore
        const price = parseSqrtSpotPrice(priceR, tokenR, tokenRQuote, 1)

        positions[tokenOutAddress].entry = add(positions[tokenOutAddress].entry, weiToNumber(amountIn.mul(numberToWei(price) || 0), 18 + (tokenIn?.decimal || 18)))
        positions[tokenOutAddress].amountIn = add(positions[tokenOutAddress].amountIn, weiToNumber(amountIn, tokenIn?.decimal || 18))
      } else if (positions[tokenInAddress] && positions[tokenInAddress].entry) {
        const oldEntry = div(mul(positions[tokenInAddress].entry, amountIn),positions[tokenInAddress].balance)
        positions[tokenOutAddress].entry = add(positions[tokenOutAddress].entry, oldEntry)
        positions[tokenOutAddress].amountIn = add(positions[tokenOutAddress].amountIn, weiToNumber(amountIn, tokenIn?.decimal || 18))
      }
    }

    if ([POOL_IDS.A, POOL_IDS.B, POOL_IDS.C].includes(sideIn.toNumber())) {
      if (positions[tokenInAddress] && positions[tokenInAddress].entry) {
        const oldEntry = div(mul(positions[tokenInAddress].entry, amountIn), positions[tokenInAddress].balance)
        positions[tokenInAddress] = {
          balance: positions[tokenInAddress].balance.sub(amountIn),
          entry: sub(positions[tokenInAddress].entry, oldEntry),
          amountIn: sub(positions[tokenInAddress].amountIn, weiToNumber(amountIn, tokenIn?.decimal || 18))
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
          logIndex: log.logIndex,
          poolIn,
          poolOut,
          tokenIn,
          tokenOut,
          ...formatedData,
        }
      })

      return (
        swapLogs
          .filter((l) => l !== null)
          .sort((a, b) => b!.blockNumber - a!.blockNumber || b!.logIndex - a!.logIndex)
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
