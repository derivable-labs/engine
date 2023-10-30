import { BigNumber, ethers } from 'ethers'
import { LogType, TokenType } from '../types'
import { NATIVE_ADDRESS, POOL_IDS } from '../utils/constant'
import {
  add,
  bn,
  div,
  getTopics,
  max,
  mul,
  numberToWei,
  parsePrice,
  sub,
  weiToNumber,
} from '../utils/helper'
import { Profile } from '../profile'
import { IEngineConfig } from '../utils/configs'
import { Resource } from './resource'
import Erc20 from '../abi/ERC20.json'

export class History {
  account?: string
  RESOURCE: Resource
  config: IEngineConfig
  profile: Profile

  constructor(config: IEngineConfig & { RESOURCE: Resource }, profile: Profile) {
    this.config = config
    this.account = config.account
    this.RESOURCE = config.RESOURCE
    this.profile = profile
  }

  generatePositions({ tokens, logs }: { tokens: TokenType[]; logs: LogType[] }) {
    try {
      if (!logs || logs.length === 0) {
        return []
      }

      let positions = {}
      logs = logs.sort((a, b) => a.blockNumber - b.blockNumber)
      logs.forEach((log: LogType) => {
        const abi = this.getSwapAbi(log.topics[0])
        const encodeData = ethers.utils.defaultAbiCoder.encode(abi, log.args.args)
        const formatedData = ethers.utils.defaultAbiCoder.decode(abi, encodeData)
        positions = this.generatePositionBySwapLog(positions, tokens, formatedData)
      })

      for (let i in positions) {
        positions[i].entryPrice =
          positions[i].value && positions[i].balanceToCalculatePrice && positions[i].balanceToCalculatePrice.gt(0)
            ? div(positions[i].value, positions[i].balanceToCalculatePrice)
            : 0
      }

      return positions
    } catch (e) {
      throw e
    }
  }

  generatePositionBySwapLog(positions: any, tokens: TokenType[], formatedData: any) {
    const pools = this.RESOURCE.pools
    const poolAddresses = Object.keys(this.RESOURCE.pools)

    const { poolIn, poolOut, sideIn, sideOut, amountOut, amountIn, priceR, price } = formatedData

    if (!poolAddresses.includes(poolIn) || !poolAddresses.includes(poolOut)) {
      return positions
    }

    const tokenInAddress = this.getTokenAddressByPoolAndSide(poolIn, formatedData.sideIn)
    const tokenOutAddress = this.getTokenAddressByPoolAndSide(poolOut, formatedData.sideOut)
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
      if (priceR?.gt(0)) {
        positions[tokenOutAddress].balance = positions[tokenOutAddress].balance.add(amountOut)
      }

      if ([POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) && priceR?.gt(0)) {
        const pool = pools[poolIn]
        const tokenR = tokens.find((t) => t.address === pool.TOKEN_R)
        const tokenRQuote = tokens.find((t) => t.address === this.profile.configs.stablecoins[0])
        // priceR is independent to the pool index, so no pool is passed in here
        const priceRFormated = parsePrice(priceR, tokenR!, tokenRQuote!)
        positions[tokenOutAddress].totalEntryR = add(positions[tokenOutAddress].totalEntryR ?? 0, amountIn)
        positions[tokenOutAddress].entry = add(
          positions[tokenOutAddress].entry,
          weiToNumber(amountIn.mul(numberToWei(priceRFormated) || 0), 18 + (tokenIn?.decimal || 18)),
        )
      }

      if (price) {
        const pool = pools[poolOut]
        const { baseToken, quoteToken } = pool
        //@ts-ignore
        const indexPrice = parsePrice(
          price,
          tokens.find((t) => t?.address === baseToken) as TokenType,
          tokens.find((t) => t?.address === quoteToken) as TokenType,
          pool,
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
          balanceToCalculatePrice: max(positions[tokenInAddress].balanceToCalculatePrice.sub(amountIn), bn(0)),
        }
      }
    }
    return positions
  }

  formatSwapHistory({ transferLogs, swapLogs, tokens }: { transferLogs: LogType[]; swapLogs: LogType[]; tokens: TokenType[] }) {
    try {
      if (!swapLogs || swapLogs.length === 0) {
        return []
      }
      const pools = this.RESOURCE.pools

      const poolAddresses = Object.keys(this.RESOURCE.pools)
      const _swapLogs = swapLogs.map((log) => {
        const abi = this.getSwapAbi(log.topics[0])
        const formatedData = this.decodeSwapLog(abi, log.args.args)

        const { poolIn, poolOut, sideIn, sideOut, amountIn, amountOut, price, priceR } = formatedData

        if (!poolAddresses.includes(poolIn) || !poolAddresses.includes(poolOut)) {
          return null
        }

        let tokenInAddress = this.getTokenAddressByPoolAndSide(poolIn, formatedData.sideIn)
        let tokenOutAddress = this.getTokenAddressByPoolAndSide(poolOut, formatedData.sideOut)
        const tokenIn = tokens.find((t) => t.address === tokenInAddress)
        const tokenOut = tokens.find((t) => t.address === tokenOutAddress)

        let entryValue
        let entryPrice
        const pool = [POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) ? pools[poolIn] : pools[poolOut]
        const { TOKEN_R, baseToken, quoteToken } = pool
        if (
          ([POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) || [POOL_IDS.R, POOL_IDS.native].includes(sideOut.toNumber())) &&
          priceR?.gt(0)
        ) {
          const amount = [POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) ? amountIn : amountOut
          const tokenR = tokens.find((t) => t.address === TOKEN_R)
          const tokenRQuote = tokens.find((t) => t.address === this.profile.configs.stablecoins[0])
          // priceR is independent to the pool index, so no pool is passed in here
          const priceRFormated = parsePrice(priceR, tokenR!, tokenRQuote!)
          entryValue = weiToNumber(amount.mul(numberToWei(priceRFormated) || 0), 18 + (tokenIn?.decimal || 18))
        }

        if (price) {
          entryPrice = parsePrice(
            price,
            tokens.find((t) => t?.address === baseToken) as TokenType,
            tokens.find((t) => t?.address === quoteToken) as TokenType,
            pool,
          )
        }

        const _transferLog = transferLogs.find((l) => l.transactionHash === log.transactionHash)
        const anyTokenHistoryData: any = {}
        if (_transferLog) {
          const _transferData = this.decodeTransferLog(_transferLog.data, _transferLog.topics)
          if (this.account === _transferData.from) {
            anyTokenHistoryData.tokenIn = _transferLog.contractAddress
            anyTokenHistoryData.amountIn = _transferData.value
          } else if (this.account === _transferData.to) {
            anyTokenHistoryData.tokenOut = _transferLog.contractAddress
            anyTokenHistoryData.amountOut = _transferData.value
          }
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
          ...anyTokenHistoryData,
        }
      })

      return _swapLogs.filter((l) => l !== null).sort((a, b) => b!.blockNumber - a!.blockNumber || b!.logIndex - a!.logIndex)
    } catch (e) {
      throw e
    }
  }

  getTokenAddressByPoolAndSide(poolAddress: string, side: BigNumber) {
    const pool = this.RESOURCE.pools[poolAddress]
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

  decodeTransferLog(data: string, topics: string[]) {
    const abiInterface = new ethers.utils.Interface(Erc20)
    return abiInterface.decodeEventLog('Transfer', data, topics)
  }

  decodeSwapLog(abi: any, args: any) {
    const encodeData = ethers.utils.defaultAbiCoder.encode(abi, args)
    return ethers.utils.defaultAbiCoder.decode(abi, encodeData)
  }
}
