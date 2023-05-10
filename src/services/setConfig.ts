import { Engine } from '../engine'
import { ethers } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ARBITRUM_CONFIG,
  BNB_CONFIG,
  DEFAULT_CONFIG,
  DerivableContractAddress,
  TESTNET_CONFIG,
  config,
} from '../utils/configs'
import { UniV2Pair } from './uniV2Pair'
import { Storage } from '../types'
import { UniV3Pair } from './uniV3Pair'

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
  poolAddress?: string
  timePerBlock: number
  nativeToken?: string
  addresses: Partial<DerivableContractAddress>
  logic?: any
}

export class Derivable {
  static loadConfig(
    account: string,
    config = DEFAULT_CONFIG,
    chainIdProp?: number,
  ): ConfigType {
    if (chainIdProp) {
      config = this.checkConfig(chainIdProp)
    }
    const chainId = config.chainId
    const scanApi = config.scanApi
    const rpcUrl = config.rpcUrl
    const overrideProvider = new JsonRpcProvider(config.rpcUrl)
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
    const signer = provider.getSigner()
    const storage = config.storage
    const providerToGetLog = new ethers.providers.JsonRpcProvider(
      config.rpcToGetLogs || config.rpcUrl,
    )
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
      poolAddress,
      timePerBlock,
      nativeToken,
      addresses,
    }
  }

  static loadContract(
    config = DEFAULT_CONFIG,
    chainIdProp?: number,
  ): DerivableContractAddress {
    if (chainIdProp) {
      config = this.checkConfig(chainIdProp)
    }
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

  static checkConfig(chainId: number): config {
    switch (chainId) {
      case 56:
        return BNB_CONFIG
      case 1337:
        return TESTNET_CONFIG
      case 42161:
        return ARBITRUM_CONFIG
      default:
        return BNB_CONFIG
    }
  }
}
