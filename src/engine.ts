import { PoolsType, Storage, SwapLog, TokenType } from './types'
import { ethers } from 'ethers'
import { Price } from './services/price'
import { Resource } from './services/resource'
import { BnA } from './services/balanceAndAllowance'
import { UniV2Pair } from './services/uniV2Pair'
import { History } from './services/history'
import { Swap } from './services/swap'
import { CurrentPool, PoolData } from './services/currentPool'
import { CreatePool } from './services/createPool'
import { JsonRpcProvider } from '@ethersproject/providers'
import { UniV3Pair } from './services/uniV3Pair'
import { ConfigType, Derivable } from './services/setConfig'
import { DEFAULT_CONFIG } from './utils/configs'

// type ConfigType = {
//   chainId: number
//   scanApi: string
//   rpcUrl: string
//   signer?: ethers.providers.JsonRpcSigner
//   provider: ethers.providers.Provider
//   providerToGetLog: ethers.providers.Provider
//   account?: string
//   storage?: Storage
// }

export class Engine {
  chainId: number
  scanApi?: string
  rpcUrl: string
  account?: string
  signer?: ethers.providers.JsonRpcSigner
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  storage?: Storage
  PRICE: Price
  RESOURCE: Resource
  BNA: BnA
  UNIV2PAIR: UniV2Pair
  UNIV3PAIR: UniV3Pair
  HISTORY: History
  SWAP: Swap
  CURRENT_POOL: CurrentPool
  currentPoolAddress: string
  CREATE_POOL: CreatePool
  config: ConfigType

  constructor(account: string, config = DEFAULT_CONFIG, chainIdProp?: number) {
    this.config = Derivable.loadConfig(account, config, chainIdProp)
    this.chainId = this.config.chainId
    this.scanApi = this.config.scanApi
    this.rpcUrl = this.config.rpcUrl
    this.storage = this.config.storage
    this.overrideProvider = this.config.overrideProvider
    this.provider = this.config.provider
    this.account = account
    this.signer = this.config.signer
    this.providerToGetLog = this.config.providerToGetLog
    this.initServices()
  }

  initServices() {
    this.UNIV2PAIR = new UniV2Pair(this.config)
    this.UNIV3PAIR = new UniV3Pair(this.config)
    this.BNA = new BnA(this.config)
    this.RESOURCE = new Resource(this.config)
    this.PRICE = new Price(this.config)
    this.CURRENT_POOL = new CurrentPool(this.config)
    this.HISTORY = new History(this.config)
    this.SWAP = new Swap(this.config)
    this.CREATE_POOL = new CreatePool(this.config)
  }

  setCurrentPool(poolData: any) {
    this.CURRENT_POOL.initCurrentPoolData(poolData)
  }
}
