import { ethers } from 'ethers';
import { ConfigType } from './setConfig';
export declare class UniV3Pair {
    chainId: number;
    scanApi?: string;
    provider: ethers.providers.Provider;
    rpcUrl: string;
    pairsV3Info: string;
    constructor(config: ConfigType);
    getPairInfo({ pairAddress, flag, }: {
        pairAddress: string;
        flag?: string;
    }): Promise<any>;
    getPairsInfo({ pairAddresses, flag, }: {
        flag?: string;
        pairAddresses: string[];
    }): Promise<{}>;
}
