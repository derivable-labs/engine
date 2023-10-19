import { IEngineConfig, INetworkConfig } from './utils/configs'
import { EventDataAbis } from './utils/constant'
import BnA from './abi/BnA.json'
import ERC20 from './abi/ERC20.json'
import TokensInfo from './abi/TokensInfo.json'
import Events from './abi/Events.json'
import PairDetail from './abi/PairDetail.json'
import PairV3Detail from './abi/PairV3Detail.json'
import Pool from './abi/Pool.json'
import ReserveTokenPrice from './abi/ReserveTokenPrice.json'
import Token from './abi/Token.json'
import Helper from './abi/Helper.json'
import PoolOverride from './abi/PoolOverride.json'
import UTR from './abi/UTR.json'
import FetcherV2 from './abi/FetcherV2.json'
import UTROverride from './abi/UTROverride.json'
import fetch from 'node-fetch'

const abis = {
  BnA,
  FetcherV2,
  ERC20,
  Events,
  PairDetail,
  PairV3Detail,
  Pool,
  ReserveTokenPrice,
  Token,
  TokensInfo,
  Helper,
  PoolOverride,
  UTR,
  UTROverride,
}

const DDL_CONFIGS_URL = {
  development: `https://raw.githubusercontent.com/derivable-labs/configs/dev/`,
  production: `https://raw.githubusercontent.com/derivable-labs/configs/main/`,
}

export class Profile {
  chainId: number
  env: 'development' | 'production'
  configs: INetworkConfig
  routes: {
    [key: string]: { type: string; address: string }[]
  }

  constructor(engineConfig: IEngineConfig) {
    this.chainId = engineConfig.chainId
    this.env = engineConfig.env || 'production'
  }

  async loadConfig() {
    const [networkConfig, uniV3Pools] = await Promise.all([
      fetch(DDL_CONFIGS_URL[this.env] + this.chainId + '/network.json').then((r) => r.json()),
      fetch(DDL_CONFIGS_URL[this.env] + this.chainId + '/routes.json')
        .then((r) => r.json())
        .catch(() => []),
    ])
    this.configs = networkConfig
    this.routes = uniV3Pools
  }

  getAbi(name: string) {
    return abis[name] ? abis[name] : abis[this.chainId][name] || []
  }

  getEventDataAbi() {
    return EventDataAbis
  }
}
