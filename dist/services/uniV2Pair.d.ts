import { ethers } from 'ethers';
import { DerivableContractAddress } from '../utils/configs';
import { ConfigType } from './setConfig';
export declare class UniV2Pair {
    chainId: number;
    scanApi?: string;
    provider: ethers.providers.Provider;
    constractAddresses: Partial<DerivableContractAddress>;
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
