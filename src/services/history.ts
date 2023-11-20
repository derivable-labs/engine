import { BigNumber, ethers } from 'ethers'
import { LogType, TokenType } from '../types'
import { NATIVE_ADDRESS, POOL_IDS } from '../utils/constant'
import {
  BIG,
  IEW,
  WEI,
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
import { M256, Resource } from './resource'
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
        positions = this.generatePositionBySwapLog(positions, tokens, log)
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

  generatePositionBySwapLog(positions: any, tokens: TokenType[], log: LogType) {
    const { derivable: { playToken }, tokens: whiteListToken } = this.profile.configs

    const pools = this.RESOURCE.pools
    const poolAddresses = Object.keys(this.RESOURCE.pools)

    const abi = this.getSwapAbi(log.topics[0])
    const encodeData = ethers.utils.defaultAbiCoder.encode(abi, log.args.args)
    const formatedData = ethers.utils.defaultAbiCoder.decode(abi, encodeData)

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
          avgPriceR: 0,
          avgPrice: 0,
          balanceForPriceR: bn(0),
          balanceForPrice: bn(0),
          balance: bn(0),
          balanceToCalculatePrice: bn(0), // to calculate entry price, balanceToCalculatePrice = total amountOut
          value: 0, // to calculate entry price, value = amountOut * indexPrice => entry price = total value / total amount out
          entry: 0, // totalEntryUSD
          totalEntryR: 0, // totalEntryR
        }
      }

      const pool = pools[poolOut]
      const pos = positions[tokenOutAddress]

      if ([POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber())) {
        if (priceR?.gt(0) || pool.TOKEN_R == playToken) {
          const tokenR = tokens.find((t) => t.address === pool.TOKEN_R)
          if (!tokenR) {
            console.warn('missing token info for TOKEN_R', tokenR)
          } else {
            let playTokenPrice: any = whiteListToken?.[playToken]?.price ?? 1
            if (typeof playTokenPrice === 'string' && playTokenPrice?.startsWith('0x')) {
              // ignore the x96 price here
              playTokenPrice = 1
            }
            const priceRFormated = pool.TOKEN_R == playToken
              ? playTokenPrice
              : this.extractPriceR(tokenR, tokens, priceR, log)
            if (!priceRFormated) {
              console.warn('unable to extract priceR')
            } else {
              pos.avgPriceR = IEW(
                BIG(WEI(pos.avgPriceR)).mul(pos.balanceForPriceR)
                .add(
                  BIG(WEI(priceRFormated)).mul(amountOut)
                )
                .div(pos.balanceForPriceR.add(amountOut))
              )
              pos.balanceForPriceR = pos.balanceForPriceR.add(amountOut)
              pos.balance = pos.balance.add(amountOut)
              pos.totalEntryR = add(pos.totalEntryR ?? 0, amountIn)
              pos.entry = add(
                pos.entry,
                weiToNumber(amountIn.mul(numberToWei(priceRFormated) || 0), 18 + (tokenIn?.decimal || 18)),
              )
              // console.log(pos.totalEntryR, pos.entry)
            }
          }
        }
      }

      if (price) {
        const { baseToken, quoteToken } = pool
        //@ts-ignore
        const indexPrice = parsePrice(
          price,
          tokens.find((t) => t?.address === baseToken) as TokenType,
          tokens.find((t) => t?.address === quoteToken) as TokenType,
          pool,
        )
        pos.value = add(pos.value, mul(amountOut, indexPrice))
        pos.balanceToCalculatePrice = pos.balanceToCalculatePrice.add(amountOut)
        pos.avgPrice = IEW(
          BIG(WEI(pos.avgPrice)).mul(pos.balanceForPrice)
          .add(
            BIG(WEI(indexPrice)).mul(amountOut)
          )
          .div(pos.balanceForPrice.add(amountOut))
        )
      }

      pos.balanceForPrice = pos.balanceForPrice.add(amountOut)
    }

    if ([POOL_IDS.A, POOL_IDS.B, POOL_IDS.C].includes(sideIn.toNumber())) {
      const pool = pools[poolIn]
      const pos = positions[tokenInAddress]
      if (priceR?.gt(0) || pool.TOKEN_R == playToken) {
        pos.balanceForPriceR = pos.balanceForPriceR.sub(amountIn)
      }
      if (price) {
        pos.balanceForPrice = pos.balanceForPrice.sub(amountIn)
      }
      if (pos && pos.entry) {
        const oldEntry = div(mul(pos.entry, amountIn), pos.balance)
        const oldEntryR = div(mul(pos.totalEntryR, amountIn), pos.balance)
        const oldValue = div(mul(pos.value, amountIn), pos.balance)
        positions[tokenInAddress] = {
          balance: max(pos.balance.sub(amountIn), bn(0)),
          entry: max(sub(pos.entry, oldEntry), 0),
          totalEntryR: max(sub(pos.totalEntryR, oldEntryR), 0),
          value: max(sub(pos.value, oldValue), 0),
          balanceToCalculatePrice: max(pos.balanceToCalculatePrice.sub(amountIn), bn(0)),
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
        const { derivable: { playToken }, tokens: whiteListToken } = this.profile.configs
        if (
          ([POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) ||
          [POOL_IDS.R, POOL_IDS.native].includes(sideOut.toNumber())) &&
          (priceR?.gt(0) || TOKEN_R == playToken)
        ) {
          const amount = [POOL_IDS.R, POOL_IDS.native].includes(sideIn.toNumber()) ? amountIn : amountOut
          const tokenR = tokens.find((t) => t.address === TOKEN_R)
          if (!tokenR) {
            console.warn('missing token info for TOKEN_R', tokenR)
          } else {
            let playTokenPrice: any = whiteListToken?.[playToken]?.price ?? 1
            if (typeof playTokenPrice === 'string' && playTokenPrice?.startsWith('0x')) {
              // ignore the x96 price here
              playTokenPrice = 1
            }
            const priceRFormated = pool.TOKEN_R == playToken
              ? playTokenPrice
              : this.extractPriceR(tokenR, tokens, priceR, log)
            if (!priceRFormated) {
              console.warn('unable to extract priceR')
            } else {
              entryValue = weiToNumber(amount.mul(numberToWei(priceRFormated) || 0), 18 + (tokenIn?.decimal || 18))
              // console.log(tokenR.symbol, tokenRQuote.symbol, _priceR.toString(), priceRFormated, entryValue)
            }
          }
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

  extractPriceR(tokenR: TokenType, tokens: TokenType[], priceR: any, log: LogType) {
    const { address, stablecoin } = this.RESOURCE.getSingleRouteToUSD(tokenR.address) ?? {}
    if (!address) {
      console.warn('missing route to USD', tokenR)
      return undefined
    }
    const tokenRQuote = tokens.find((t) => t.address == stablecoin)
    if (!tokenRQuote) {
      console.warn('missing token info for TOKEN_R quote', stablecoin)
      return undefined
    }
    let _priceR = priceR
    // fix a historical bug in BSC
    if (this.config.chainId == 56 && log.blockNumber < 33077333) {
      if (tokenR.address.localeCompare(tokenRQuote.address, undefined, { sensitivity: 'accent' }) > 0) {
        _priceR = M256.div(_priceR)
      }
    }
    // priceR is independent to the pool index, so no pool is passed in here
    return parsePrice(_priceR, tokenR, tokenRQuote)
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
