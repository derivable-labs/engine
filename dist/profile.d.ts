import { DeepPartial } from "./types/utils";
import { ConfigType } from "./services/setConfig";
import { config } from "./utils/configs";
export declare class Profile {
    chainId: number;
    abis: any;
    configs: ConfigType;
    constructor(chainId: number, configs: DeepPartial<ConfigType>);
    loadConfig(configProp: DeepPartial<config>, chainIdProp: number): ConfigType;
    getAbi(name: string): any;
    getEventDataAbi(): any;
}
