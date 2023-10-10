import { Resource } from './resource'
import { PoolType } from '../types'
import { IEngineConfig } from '../utils/configs'

export type PoolData = {
  baseToken: string
  quoteToken: string
  cToken: string
  dTokens: string[]
  cTokenPrice: number
  states: any
  powers: number[]
  basePrice: string
  poolAddress: string
  baseId: number
  quoteId: number
  logic: string
}

export class CurrentPool {
  resource: Resource
  pools: { [key: string]: PoolType }
  baseToken: string
  quoteToken: string
  TOKEN: string
  dTokens: string[]
  states: any
  powers: number[]
  basePrice: string
  poolAddress?: string
  chainId: number
  config: IEngineConfig
  constructor(config: IEngineConfig) {
    this.config = config
    this.chainId = config.chainId
  }

  initCurrentPoolData(poolData: PoolData) {
    for (let i in poolData) {
      this[i] = poolData[i]
    }
  }
}
