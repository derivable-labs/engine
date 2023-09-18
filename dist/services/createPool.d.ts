import { BigNumber, ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { PoolConfig } from '../types';
import { IDerivableContractAddress, IEngineConfig } from '../utils/configs';
import { Profile } from "../profile";
export declare class CreatePool {
    account?: string;
    chainId: number;
    scanApi?: string;
    provider: ethers.providers.Provider;
    overrideProvider: JsonRpcProvider;
    signer?: ethers.providers.JsonRpcSigner;
    contractAddresses: Partial<IDerivableContractAddress>;
    profile: Profile;
    constructor(config: IEngineConfig, profile: Profile);
    callStaticCreatePool({ params, value, gasLimit }: any): Promise<any>;
    createPool(params: PoolConfig, gasLimit?: BigNumber): Promise<boolean>;
    generateConfig(k: number, a: BigNumber, b: BigNumber, mark: BigNumber, recipient: string, oracle: string, initTime: number, halfLife: number): {
        utr: string;
        token: string | undefined;
        logic: string | undefined;
        oracle: string;
        reserveToken: string;
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
