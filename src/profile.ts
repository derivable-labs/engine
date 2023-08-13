import {DeepPartial} from "./types/utils";
import {ConfigType} from "./services/setConfig";
import {config, CONFIGS} from "./utils/configs";
import {JsonRpcProvider} from "@ethersproject/providers";
import {ethers} from "ethers";
import {EventDataAbis} from "./utils/constant";

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
    return tryRequire('./abi/' + name + '.json') ?  tryRequire('./abi/' + name + '.json') : (tryRequire(`./abi/${this.chainId}/${name}.json`) || [])
  }

  getEventDataAbi() {
    return EventDataAbis[this.chainId]
  }
}

const tryRequire = (path: string) => {
  try {
    return require(`${path}`);
  } catch (err) {
    return null;
  }
};