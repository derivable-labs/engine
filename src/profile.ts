import {DeepPartial} from "./types/utils";
import {ConfigType} from "./services/setConfig";
import {config, CONFIGS} from "./utils/configs";
import {JsonRpcProvider} from "@ethersproject/providers";
import {ethers} from "ethers";
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
import UTR from './abi/UTR.json'
import UTROverride from './abi/UTROverride.json'
import Helper8453 from './abi/8453/Helper.json'
import Helper42161 from './abi/42161/Helper.json'
import PoolOverride8453 from './abi/8453/PoolOverride.json'
import PoolOverride42161 from './abi/42161/PoolOverride.json'


const abis = {
  BnA,
  ERC20,
  Events,
  PairDetail,
  PairV3Detail,
  Pool,
  ReserveTokenPrice,
  Token,
  UTR,
  UTROverride,
  TokensInfo,
  8453: {
    Helper: Helper8453,
    PoolOverride: PoolOverride8453,
  },
  42161: {
    Helper: Helper42161,
    PoolOverride: PoolOverride42161,
  },
}

export class Profile {
  chainId: number
  abis: any
  configs: ConfigType

  constructor(chainId: number, configs: DeepPartial<ConfigType>) {
    this.chainId = chainId
    this.configs = this.loadConfig(configs, chainId)
  }

  loadConfig(
    configProp: DeepPartial<config>,
    chainIdProp: number,
  ): ConfigType {
    const defaultConfig = CONFIGS[chainIdProp]
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
      overrideProvider,
      provider,
      providerToGetLog,
    }
  }

  getAbi(name: string) {
    return abis[name] ?  abis[name] : (abis[this.chainId][name] || [])
  }

  getEventDataAbi() {
    return EventDataAbis[this.chainId]
  }
}