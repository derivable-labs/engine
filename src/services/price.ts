import { ethers } from 'ethers'
import ReserveTokenPrice from '../abi/ReserveTokenPrice.json'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ConfigType } from './setConfig'
import {fixed128ToFloat} from "../utils/number";
import {bn, numberToWei, weiToNumber} from "../utils/helper";

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

      console.log(
        tokens,
        this.config.addresses.wrapToken,
        this.config.addresses.uniswapFactory,
        this.config.stableCoins,
        this.config.addresses.wrapToken,
        this.config.stableCoins[0]
      )

      const res = await pairDetailContract.functions.fetchMarketBatch(
        tokens,
        this.config.addresses.uniswapFactory,
        this.config.stableCoins,
        this.config.addresses.wrapToken,
        this.config.stableCoins[0]
      )

      const result = {}
      for(let i in tokens) {
        result[tokens[i]] = res.sqrtPriceX96[i]
      }

      return result
    } catch (e) {
      throw e
    }
  }
}
