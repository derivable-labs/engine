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
import { Storage } from '../types'
import { mergeDeep } from '../utils/helper'
import { DeepPartial } from '../types/utils'

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
    configProp: DeepPartial<config>,
    chainIdProp: number,
  ): ConfigType {
    const defaultConfig = this.loadDefaultConfig(chainIdProp)
    const config = {
      ...defaultConfig,
      ...configProp,
      addresses: {
        ...defaultConfig.addresses,
        ...configProp.addresses,
      },
    }

    // const config = mergeDeep(this.loadDefaultConfig(chainIdProp), configProp)
    const overrideProvider = new JsonRpcProvider(config.rpcUrl)
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
    const providerToGetLog = new ethers.providers.JsonRpcProvider(
      config.rpcToGetLogs,
    )

    return {
      ...config,
      account,
      overrideProvider,
      provider,
      providerToGetLog,
    }
  }

  static loadContract(
    config = DEFAULT_CONFIG,
    chainIdProp?: number,
  ): DerivableContractAddress {
    if (chainIdProp) {
      config = this.loadDefaultConfig(chainIdProp)
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
    const logic = config.addresses.logic as string
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
      logic,
    }
  }

  // static setConfig(account: string, config = DEFAULT_CONFIG): Engine {
  //   const engine = new Engine(account, config)
  //   return engine
  // }

  static loadDefaultConfig(chainId: number): config {
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
