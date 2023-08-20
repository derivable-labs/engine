import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { DerivableContractAddress, config } from '../utils/configs';
import { Storage } from '../types';
import { DeepPartial } from '../types/utils';
export interface ConfigType {
    unit?: number;
    chainId: number;
    scanApi?: any;
    scanApiKey?: any;
    rpcUrl: string;
    gasLimitDefault?: number;
    signer?: ethers.providers.JsonRpcSigner;
    account?: string;
    storage?: Storage;
    overrideProvider: JsonRpcProvider;
    provider: ethers.providers.Provider;
    providerToGetLog: ethers.providers.Provider;
    poolAddress?: string;
    timePerBlock: number;
    nativeToken?: string;
    addresses: Partial<DerivableContractAddress>;
    stableCoins: Partial<string[]>;
    logic?: any;
}
export declare class Derivable {
    static loadConfig(account: string, configProp: DeepPartial<config>, chainIdProp: number): ConfigType;
    static loadContract(config?: config, chainIdProp?: number): DerivableContractAddress;
    static loadDefaultConfig(chainId: number): config;
}
