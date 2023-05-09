import { Resource } from './resource'
import { DEFAULT_CONFIG } from '../utils/configs'
import { bn } from '../utils/helper'
import { POOL_IDS } from '../utils/constant'
import { BigNumber } from 'ethers'
import { Derivable } from '../../example/setConfig'

// type ConfigType = {
//   resource: Resource
//   poolAddress: string
//   chainId: number
// }
export type PoolData = {
  baseToken: string
  quoteToken: string
  cToken: string
  dTokens: string[]
  cTokenPrice: number
  states: any
  powers: number[]
  basePrice: string
  poolAddress?: string
  baseId: number
  quoteId: number
  logic: string
}

export class CurrentPool {
  resource: Resource
  baseToken: string
  quoteToken: string
  cToken: string
  TOKEN_R: string
  TOKEN: string
  dTokens: string[]
  logicAddress?: string
  cTokenPrice: number
  states: any
  powers: number[]
  basePrice: string
  poolAddress?: string
  baseId: number
  quoteId: number
  chainId: number
  nativeToken?: string
  constructor(account: string, config = DEFAULT_CONFIG) {
    const { chainId, poolAddress, nativeToken } = Derivable.loadConfig(
      account,
      config,
    )
    this.resource = new Resource(account, config)
    this.poolAddress = poolAddress
    this.chainId = chainId
    this.nativeToken = nativeToken
    // this.loadState(configs.poolAddress)
  }

  setPoolAddress(address: string) {
    this.poolAddress = address
    // this.loadState(address)
  }

  // loadState(poolAddress: string) {
  //   if (poolAddress && !this.resource.pools[poolAddress]) {
  //     this.resource.fetchResourceData('')
  //   } else if (poolAddress && this.resource.pools[poolAddress]) {
  //     this.initCurrentPoolData(poolAddress)
  //   }
  // }

  initCurrentPoolData(poolData: PoolData) {
    for (let i in poolData) {
      this[i] = poolData[i]
    }
    // this.poolAddress = poolData.poolAddress;
    // this.baseToken = poolData.baseToken;
    // this.quoteToken = poolData.quoteToken;
    // this.cToken = poolData.cToken;
    // this.dTokens = poolData.dTokens;
    // this.logicAddress = poolData.logic;
    // this.cTokenPrice = poolData.cTokenPrice;
    // this.states = poolData.states;
    // this.powers = poolData.powers;
    // this.basePrice = poolData.basePrice;
    // this.baseId = poolData.baseId;
    // this.quoteId = poolData.quoteId;
  }

  getTokenByPower(power: number | string) {
    if (power === 'C') {
      return this.cToken
    } else if (power === 'B') {
      return this.baseToken
    } else if (power === 'Q') {
      return this.quoteToken
    } else if (power === 'N') {
      // native token
      return this.nativeToken
    }
    const index = this.powers.findIndex((p) => p === Number(power))
    return this.dTokens[index]
  }

  getIdByAddress(address: string): BigNumber {
    try {
      if (address === this.baseToken) return bn(this.baseId)
      if (address === this.quoteToken) return bn(this.quoteId)
      if (address === this.nativeToken) return bn(POOL_IDS.native)
      if (address === this.cToken) return bn(POOL_IDS.cToken)
      return bn(address.split('-')[1])
    } catch (e) {
      throw new Error('Token id not found:' + address)
    }
  }
}
