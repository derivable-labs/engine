import {Resource} from "./resource";
import {CONFIGS}  from "../utils/configs";

type ConfigType = {
  resource: Resource
  poolAddress: string
  chainId: number
}
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
  baseToken: string
  quoteToken: string
  cToken: string
  dTokens: string[]
  logicAddress?: string
  cTokenPrice: number
  states: any
  powers: number[]
  basePrice: string
  poolAddress: string
  baseId: number
  quoteId: number
  chainId: number

  constructor(configs: ConfigType) {
    this.resource = configs.resource
    this.poolAddress = configs.poolAddress

    this.chainId = configs.chainId
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
    this.poolAddress = poolData.poolAddress;
    this.baseToken = poolData.baseToken;
    this.quoteToken = poolData.quoteToken;
    this.cToken = poolData.cToken;
    this.dTokens = poolData.dTokens;
    this.logicAddress = poolData.logic;
    this.cTokenPrice = poolData.cTokenPrice;
    this.states = poolData.states;
    this.powers = poolData.powers;
    this.basePrice = poolData.basePrice;
    this.baseId = poolData.baseId;
    this.quoteId = poolData.quoteId;
  }

  getTokenByPower(power: number | string){
    if (power === 'C') {
      return this.cToken
    } else if (power === 'B') {
      return this.baseToken
    } else if (power === 'Q') {
      return this.quoteToken
    } else if (power === 'N') { // native token
      return CONFIGS[this.chainId].nativeToken
    }
    const index = this.powers.findIndex((p) => p === Number(power))
    return this.dTokens[index]
  }
}
