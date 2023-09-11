import {BigNumber, ethers} from 'ethers'
import {PowerState} from 'powerLib/dist/powerLib'
import {LogType, TokenType} from '../types'
import {CurrentPool} from './currentPool'
import {EventDataAbis, NATIVE_ADDRESS, POOL_IDS} from '../utils/constant'
import {ConfigType} from './setConfig'
import {Resource} from './resource'
import {add, bn, div, getTopics, max, mul, numberToWei, parseSqrtSpotPrice, sub, weiToNumber} from "../utils/helper";
import {forEach} from "lodash";
import {Profile} from "../profile";

export class History {
  account?: string
  CURRENT_POOL: CurrentPool
  config: ConfigType
  profile: Profile

  constructor(config: ConfigType & { CURRENT_POOL: CurrentPool }, profile: Profile) {
    this.config = config
    this.account = config.account
    this.CURRENT_POOL = config.CURRENT_POOL
    this.profile = profile
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

      for (let i in positions) {
        positions[i].entryPrice = positions[i].value && positions[i].balanceToCalculatePrice && positions[i].balanceToCalculatePrice.gt(0) ? div(positions[i].value, positions[i].balanceToCalculatePrice) : 0
      }

      return positions
    } catch (e) {
      throw e
    }
  }

  generatePositionBySwapLog(positions: any, tokens: TokenType[], formatedData: any) {
    const pools = this.CURRENT_POOL.pools
    const poolAddresses = Object.keys(this.CURRENT_POOL.pools)

    const {poolIn, poolOut, sideIn, sideOut, amountOut, amountIn, priceR, price} = formatedData

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
    const tokenOut = tokens.find((t) => t.address === tokenOutAddress)

    if ([POOL_IDS.A, POOL_IDS.B, POOL_IDS.C].includes(sideOut.toNumber())) {
      if (!positions[tokenOutAddress]) {
        positions[tokenOutAddress] = {
          balance: bn(0),
          balanceToCalculatePrice: bn(0), // to calculate entry price, balanceToCalculatePrice = total amountOut
          value: 0, // to calculate entry price, value = amountOut * indexPrice => entry price = total value / total amount out
          entry: 0, // totalEntryUSD
          totalEntryR: 0, // totalEntryR
        }
      }
      if (priceR) {
        positions[tokenOutAddress].balance = positions[tokenOutAddress].balance.add(amountOut)
      }

      if ([POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) && priceR) {
        const pool = pools[poolIn]
        const tokenR = tokens.find((t) => t.address === pool.TOKEN_R)
        const tokenRQuote = tokens.find((t) => t.address === this.config.stableCoins[0])
        //@ts-ignore
        const priceRFormated = parseSqrtSpotPrice(priceR, tokenR, tokenRQuote, 1)

        positions[tokenOutAddress].totalEntryR = add(positions[tokenOutAddress].totalEntryR ?? 0, amountIn)
        positions[tokenOutAddress].entry = add(positions[tokenOutAddress].entry, weiToNumber(amountIn.mul(numberToWei(priceRFormated) || 0), 18 + (tokenIn?.decimal || 18)))
      }

      if (price) {
        //@ts-ignore
        const indexPrice = parseSqrtSpotPrice(
          price,
          tokens.find((t) => t?.address === this.CURRENT_POOL.baseToken) as TokenType,
          tokens.find((t) => t?.address === this.CURRENT_POOL.quoteToken) as TokenType,
          1
        )
        positions[tokenOutAddress].value = add(positions[tokenOutAddress].value, mul(amountOut, indexPrice))
        positions[tokenOutAddress].balanceToCalculatePrice = positions[tokenOutAddress].balanceToCalculatePrice.add(amountOut)
      }
    }

    if ([POOL_IDS.A, POOL_IDS.B, POOL_IDS.C].includes(sideIn.toNumber())) {
      if (positions[tokenInAddress] && positions[tokenInAddress].entry) {
        const oldEntry = div(mul(positions[tokenInAddress].entry, amountIn), positions[tokenInAddress].balance)
        const oldEntryR = div(mul(positions[tokenInAddress].totalEntryR, amountIn), positions[tokenInAddress].balance)
        const oldValue = div(mul(positions[tokenInAddress].value, amountIn), positions[tokenInAddress].balance)
        positions[tokenInAddress] = {
          balance: max(positions[tokenInAddress].balance.sub(amountIn), bn(0)),
          entry: max(sub(positions[tokenInAddress].entry, oldEntry), 0),
          totalEntryR: max(sub(positions[tokenInAddress].totalEntryR, oldEntryR), 0),
          value: max(sub(positions[tokenInAddress].value, oldValue), 0),
          balanceToCalculatePrice: max(positions[tokenInAddress].balanceToCalculatePrice.sub(amountIn), bn(0))
        }
      }
    }
    return positions
  }

  formatSwapHistory({logs, tokens}: { logs: LogType[], tokens: TokenType[] }) {
    try {
      if (!logs || logs.length === 0) {
        return []
      }
      const pools = this.CURRENT_POOL.pools

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

        const {poolIn, poolOut, sideIn, sideOut, amountIn, amountOut, price, priceR} = formatedData

        if (
          !poolAddresses.includes(poolIn) ||
          !poolAddresses.includes(poolOut)
        ) {
          return null
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
        const tokenOut = tokens.find((t) => t.address === tokenOutAddress)

        let entryValue
        let entryPrice
        if (([POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) || [POOL_IDS.R, POOL_IDS.native].includes(sideOut.toNumber())) && priceR) {
          const pool = [POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) ? pools[poolIn] : pools[poolOut]
          const amount = [POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) ? amountIn : amountOut
          const tokenR = tokens.find((t) => t.address === pool.TOKEN_R)
          const tokenRQuote = tokens.find((t) => t.address === this.config.stableCoins[0])
          //@ts-ignore
          const priceRFormated = parseSqrtSpotPrice(priceR, tokenR, tokenRQuote, 1)
          entryValue = weiToNumber(amount.mul(numberToWei(priceRFormated) || 0), 18 + (tokenIn?.decimal || 18))
        }

        if (price) {
          //@ts-ignore
          entryPrice = parseSqrtSpotPrice(price, this.CURRENT_POOL.pair.token0, this.CURRENT_POOL.pair.token1, this.CURRENT_POOL.pair.quoteTokenIndex)
        }

        return {
          transactionHash: log.transactionHash,
          timeStamp: log.timeStamp,
          blockNumber: log.blockNumber,
          logIndex: log.logIndex,
          poolIn,
          poolOut,
          tokenIn: tokenInAddress,
          tokenOut: tokenOutAddress,
          entryValue,
          entryPrice,
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
      return this.profile.getEventDataAbi().Swap
    } else if (topic0 === topics.Swap[1]) {
      return this.profile.getEventDataAbi().Swap1
    } else {
      return this.profile.getEventDataAbi().Swap2
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
