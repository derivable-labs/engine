import { BigNumber, ethers } from 'ethers';
import { UniV2Pair } from './uniV2Pair';
import { JsonRpcProvider } from '@ethersproject/providers';
import { PoolConfig } from '../types';
type ConfigType = {
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
    callStaticCreatePool({ params, value, gasLimit }: any): Promise<any>;
    createPool(params: PoolConfig, gasLimit?: BigNumber): Promise<boolean>;
    generateConfig(k: number, a: BigNumber, b: BigNumber, mark: BigNumber, recipient: string, oracle: string, initTime: number, halfLife: number): {
        utr: any;
        token: any;
        logic: any;
        oracle: string;
        reserveToken: any;
        recipient: string;
        mark: BigNumber;
        k: number;
        a: BigNumber;
        b: BigNumber;
        initTime: number;
        halfLife: number;
    };
    getStateCalHelperContract(provider?: any): ethers.Contract;
}
export {};
