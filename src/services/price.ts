import { ethers } from 'ethers'
import ReserveTokenPrice from '../abi/ReserveTokenPrice.json'
import { JsonRpcProvider } from '@ethersproject/providers'
import {div, formatPercent, sub} from '../utils/helper'
import {TokenType} from "../types";
import {MINI_SECOND_PER_DAY} from "../utils/constant";
import historyProvider from "../historyProvider";
import {IEngineConfig} from "../utils/configs";
import {Profile} from "../profile";

export class Price {
  chainId: number
  scanApi?: string
  provider: ethers.providers.Provider
  rpcUrl: string
  reserveTokenPrice: string
  config: IEngineConfig
  profile: Profile

  constructor(config: IEngineConfig, profile: Profile) {
    this.reserveTokenPrice = '0x' + ReserveTokenPrice.deployedBytecode.slice(-40)
    this.chainId = config.chainId
    this.scanApi = profile.configs.scanApi
    this.provider = new JsonRpcProvider(profile.configs.rpc)
    this.rpcUrl = profile.configs.rpc
    this.profile = profile
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
        this.profile.configs.uniswap.v3Factory,
        this.profile.configs.stablecoins,
        this.profile.configs.wrappedTokenAddress,
        this.profile.configs.stablecoins[0],
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
