import {IEngineConfig, INetworkConfig} from "./utils/configs";
import {EventDataAbis} from "./utils/constant";
import BnA from './abi/BnA.json'
import ERC20 from './abi/ERC20.json'
import TokensInfo from './abi/TokensInfo.json'
import Events from './abi/Events.json'
import PairDetail from './abi/PairDetail.json'
import PairV3Detail from './abi/PairV3Detail.json'
import Pool from './abi/Pool.json'
import ReserveTokenPrice from './abi/ReserveTokenPrice.json'
import Token from './abi/Token.json'
import Helper8453 from './abi/8453/Helper.json'
import Helper42161 from './abi/42161/Helper.json'
import PoolOverride8453 from './abi/8453/PoolOverride.json'
import UTR8453 from './abi/8453/UTR.json'
import UTROverride8453 from './abi/8453/UTROverride.json'
import PoolOverride42161 from './abi/42161/PoolOverride.json'
import UTR42161 from './abi/42161/UTR.json'
import UTROverride42161 from './abi/42161/UTROverride.json'
import fetch from "node-fetch";

const abis = {
  BnA,
  ERC20,
  Events,
  PairDetail,
  PairV3Detail,
  Pool,
  ReserveTokenPrice,
  Token,
  TokensInfo,
  8453: {
    Helper: Helper8453,
    PoolOverride: PoolOverride8453,
    UTR: UTR8453,
    UTROverride: UTROverride8453,
  },
  42161: {
    Helper: Helper42161,
    PoolOverride: PoolOverride42161,
    UTR: UTR42161,
    UTROverride: UTROverride42161,
  },
}

const DDL_CONFIGS_URL = {
  'development': `https://raw.githubusercontent.com/derivable-labs/configs/dev/`,
  'production': `https://raw.githubusercontent.com/derivable-labs/configs/main/`,
}

export class Profile {
  chainId: number
  env: 'development' | 'production'
  configs: INetworkConfig
  routes: {
    [key: string]: {type: string, address: string}[]
  }

  constructor(engineConfig: IEngineConfig) {
    this.chainId = engineConfig.chainId
    this.env = engineConfig.env || 'production'
  }

  async loadConfig() {
    const [networkConfig, uniV3Pools] = await Promise.all([
      fetch(DDL_CONFIGS_URL[this.env] + this.chainId + '/network.json').then((r) => r.json()),
      fetch(DDL_CONFIGS_URL[this.env] + this.chainId + '/routes.json').then((r) => r.json())
    ])
    this.configs = networkConfig
    this.routes = uniV3Pools
  }

  getAbi(name: string) {
    return abis[name] ? abis[name] : (abis[this.chainId][name] || [])
  }

  getEventDataAbi() {
    return EventDataAbis[this.chainId]
  }
}
