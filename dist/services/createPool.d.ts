import { BigNumber, ethers } from 'ethers';
import { UniV2Pair } from './uniV2Pair';
import { JsonRpcProvider } from '@ethersproject/providers';
import { PoolConfig } from '../types';
import { ConfigType } from './setConfig';
import { DerivableContractAddress } from '../utils/configs';
export declare class CreatePool {
    account?: string;
    chainId: number;
    scanApi?: string;
    provider: ethers.providers.Provider;
    overrideProvider: JsonRpcProvider;
    signer?: ethers.providers.JsonRpcSigner;
    UNIV2PAIR: UniV2Pair;
    contractAddresses: Partial<DerivableContractAddress>;
    constructor(config: ConfigType);
    callStaticCreatePool({ params, value, gasLimit }: any): Promise<any>;
    createPool(params: PoolConfig, gasLimit?: BigNumber): Promise<boolean>;
    generateConfig(k: number, a: BigNumber, b: BigNumber, mark: BigNumber, recipient: string, oracle: string, initTime: number, halfLife: number): {
        utr: string | undefined;
        token: string | undefined;
        logic: string | undefined;
        oracle: string;
        reserveToken: string | undefined;
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
