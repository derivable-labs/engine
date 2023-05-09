import { Engine } from '../src/engine'
import { ethers } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { DEFAULT_CONFIG, DerivableContractAddress } from '../src/utils/configs'
import { UniV2Pair } from '../src/services/uniV2Pair'
import { Storage } from '../src/types'
import { UniV3Pair } from '../src/services/uniV3Pair'

export interface ConfigType {
  chainId: number
  scanApi?: string
  rpcUrl: string
  signer?: ethers.providers.JsonRpcSigner
  account?: string
  storage?: Storage
  overrideProvider: JsonRpcProvider
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  UNIV2PAIR: UniV2Pair
  UNIV3PAIR: UniV3Pair
  poolAddress?: string
  timePerBlock: number
  nativeToken?: string
  addresses: Partial<DerivableContractAddress>
}

export class Derivable {
  static loadConfig(account: string, config = DEFAULT_CONFIG): ConfigType {
    const chainId = config.chainId
    const scanApi = config.scanApi
    const rpcUrl = config.rpcUrl
    const overrideProvider = new JsonRpcProvider(config.rpcUrl)
    const provider = new ethers.providers.JsonRpcProvider(config.rpcToGetLogs)
    const signer = provider.getSigner()
    const storage = config.storage
    const providerToGetLog = new ethers.providers.JsonRpcProvider(
      config.rpcToGetLogs,
    )
    const UNIV2PAIR = new UniV2Pair(account, config)
    const UNIV3PAIR = new UniV3Pair(account, config)
    const poolAddress = config.poolAddress
    const timePerBlock = config.timePerBlock
    const nativeToken = config.nativeToken
    const addresses = config.addresses

    return {
      chainId,
      scanApi,
      rpcUrl,
      signer,
      account,
      storage,
      overrideProvider,
      provider,
      providerToGetLog,
      UNIV2PAIR,
      UNIV3PAIR,
      poolAddress,
      timePerBlock,
      nativeToken,
      addresses,
    }
  }

  static loadContract(config = DEFAULT_CONFIG): DerivableContractAddress {
    const token = config.addresses.token as string
    const multiCall = config.addresses.multiCall as string
    const pairsInfo = config.addresses.pairsInfo as string
    const pairsV3Info = config.addresses.pairsV3Info as string
    const bnA = config.addresses.bnA as string
    const tokensInfo = config.addresses.tokensInfo as string
    const router = config.addresses.router as string
    const wrapToken = config.addresses.wrapToken as string
    const wrapUsdPair = config.addresses.wrapUsdPair as string
    const poolFactory = config.addresses.poolFactory as string
    const stateCalHelper = config.addresses.stateCalHelper as string
    return {
      token,
      multiCall,
      pairsInfo,
      pairsV3Info,
      bnA,
      tokensInfo,
      router,
      wrapToken,
      wrapUsdPair,
      poolFactory,
      stateCalHelper,
    }
  }

  static setConfig(account: string, config = DEFAULT_CONFIG): Engine {
    const engine = new Engine(account, config)
    return engine
  }
}
