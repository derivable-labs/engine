import { BigNumber, ethers } from "ethers";
import { UniV2Pair } from "./uniV2Pair";
import { JsonRpcProvider } from "@ethersproject/providers";
import { PoolConfig } from "../types";
declare type ConfigType = {
    account?: string;
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
    overrideProvider: JsonRpcProvider;
    signer?: ethers.providers.JsonRpcSigner;
    UNIV2PAIR: UniV2Pair;
};
export declare class CreatePool {
    account?: string;
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
    overrideProvider: JsonRpcProvider;
    signer?: ethers.providers.JsonRpcSigner;
    UNIV2PAIR: UniV2Pair;
    constructor(configs: ConfigType);
    encodePowers(powers: any): string;
    createPool(params: PoolConfig, gasLimit?: BigNumber): Promise<boolean>;
}
export {};
