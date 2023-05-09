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
import { Derivable } from '../example/setConfig'
import { DEFAULT_CONFIG, config } from './utils/configs'

type ConfigType = {
  chainId: number
  scanApi: string
  rpcUrl: string
  signer?: ethers.providers.JsonRpcSigner
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  account?: string
  storage?: Storage
}

export class Engine {
  chainId: number
  scanApi?: string
  rpcUrl: string
  account: string
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
  config: config

  constructor(account: string, config = DEFAULT_CONFIG) {
    const {
      chainId,
      scanApi,
      rpcUrl,
      signer,
      overrideProvider,
      provider,
      providerToGetLog,
      storage,
    } = Derivable.loadConfig(account, config)
    this.config = config
    this.chainId = chainId
    this.scanApi = scanApi
    this.rpcUrl = rpcUrl
    this.storage = storage
    this.overrideProvider = overrideProvider
    this.provider = provider
    this.account = account
    this.signer = signer
    this.providerToGetLog = providerToGetLog
    this.initServices()
  }

  initServices() {
    this.UNIV2PAIR = new UniV2Pair(this.account, this.config)
    this.UNIV3PAIR = new UniV3Pair(this.account, this.config)
    this.BNA = new BnA(this.account, this.config)
    this.RESOURCE = new Resource(this.account, this.config)
    this.PRICE = new Price(this.account, this.config)
    this.CURRENT_POOL = new CurrentPool(this.account, this.config)
    this.HISTORY = new History(this.account, this.config)
    this.SWAP = new Swap(this.account, this.config)
    this.CREATE_POOL = new CreatePool(this.account, this.config)
  }

  setCurrentPool(poolData: any) {
    this.CURRENT_POOL.initCurrentPoolData(poolData)
  }
}
