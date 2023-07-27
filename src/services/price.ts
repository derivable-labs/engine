import { ethers } from 'ethers'
import ReserveTokenPrice from '../abi/ReserveTokenPrice.json'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ConfigType } from './setConfig'
import { fixed128ToFloat } from '../utils/number'
import {bn, div, formatPercent, numberToWei, sub, weiToNumber} from '../utils/helper'
import {TokenType} from "../types";
import {MINI_SECOND_PER_DAY} from "../utils/constant";
import historyProvider from "../historyProvider";

export class Price {
  chainId: number
  scanApi?: string
  provider: ethers.providers.Provider
  rpcUrl: string
  reserveTokenPrice: string
  config: ConfigType

  constructor(config: ConfigType) {
    const { chainId, scanApi, provider, rpcUrl } = config
    const { reserveTokenPrice } = config.addresses
    if (!reserveTokenPrice) {
      throw new Error(`required pairsV3Info contract to be defined!`)
    }
    this.config = config
    this.chainId = chainId
    this.scanApi = scanApi
    this.provider = provider
    this.rpcUrl = rpcUrl
    this.reserveTokenPrice = reserveTokenPrice
  }


  async get24hChange({
                       baseToken,
                       cToken,
                       quoteToken,
                       chainId,
                       currentPrice,
                     }: {
    baseToken: TokenType
    cToken: string
    chainId: string
    quoteToken: TokenType
    currentPrice: string
  }) {
    try {
      const toTime = Math.floor(
        (new Date().getTime() - MINI_SECOND_PER_DAY) / 1000,
      )
      const result = await historyProvider.getBars({
        to: toTime,
        limit: 1,
        chainId,
        resolution: '1',
        route: `${baseToken.address}/${cToken}/${quoteToken.address}`,
        outputToken: quoteToken,
        inputToken: baseToken,
        barValueType: 'string'
      })
      const beforePrice = result[0].open
      return formatPercent(div(sub(currentPrice, beforePrice), beforePrice))
    } catch (e) {
      throw e
    }
  }

  async getTokenPrices(tokens: string[]) {
    try {
      const provider = new JsonRpcProvider(this.rpcUrl)
      // @ts-ignore
      provider.setStateOverride({
        [this.reserveTokenPrice]: {
          code: ReserveTokenPrice.deployedBytecode,
        },
      })

      const pairDetailContract = new ethers.Contract(
        this.reserveTokenPrice,
        ReserveTokenPrice.abi,
        provider,
      )

      const res = await pairDetailContract.functions.fetchMarketBatch(
        tokens,
        this.config.addresses.uniswapFactory,
        this.config.stableCoins,
        this.config.addresses.wrapToken,
        this.config.stableCoins[0],
      )

      const result = {}
      for (let i in tokens) {
        result[tokens[i]] = res.sqrtPriceX96[i]
      }

      return result
    } catch (e) {
      throw e
    }
  }
}
