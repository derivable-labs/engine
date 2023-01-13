import {Resource} from "./resource";

type ConfigType = {
  resource: Resource
  poolAddress: string
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

  constructor(configs: ConfigType) {
    this.resource = configs.resource
    this.poolAddress = configs.poolAddress
    this.loadState()
  }

  setPoolAddress(address: string) {
    this.poolAddress = address
    this.loadState()
  }

  loadState() {
    if (this.poolAddress && !this.resource.pools[this.poolAddress]) {
      this.resource.fetchResourceData('')
    } else if (this.poolAddress && this.resource.pools[this.poolAddress]) {
      this.initCurrentPoolData(this.poolAddress)
    }
  }

  initCurrentPoolData(poolAddress: string) {
    this.baseToken = this.resource.pools[poolAddress].baseToken;
    this.quoteToken = this.resource.pools[poolAddress].quoteToken;
    this.cToken = this.resource.pools[poolAddress].cToken;
    this.dTokens = this.resource.pools[poolAddress].dTokens;
    this.logicAddress = this.resource.pools[poolAddress].logic;
    this.cTokenPrice = this.resource.pools[poolAddress].cTokenPrice;
    this.states = this.resource.pools[poolAddress].states;
    this.powers = this.resource.pools[poolAddress].powers;
    this.basePrice = this.resource.pools[poolAddress].basePrice;
    this.baseId = this.resource.pools[poolAddress].baseId;
    this.quoteId = this.resource.pools[poolAddress].quoteId;
  }
}
