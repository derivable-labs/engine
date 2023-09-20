import { ethers } from 'ethers';
import { IEngineConfig } from '../utils/configs';
import { Profile } from "../profile";
export declare class UniV2Pair {
    chainId: number;
    scanApi?: string;
    pairsInfoAddress: string;
    provider: ethers.providers.Provider;
    constructor(config: IEngineConfig, profile: Profile);
    getPairInfo({ pairAddress, flag, }: {
        pairAddress: string;
        flag?: string;
    }): Promise<any>;
    getPairsInfo({ pairAddresses, flag, }: {
        flag?: string;
        pairAddresses: string[];
    }): Promise<{}>;
}
