import { ethers } from 'ethers';
import { ConfigType } from './setConfig';
export declare class Price {
    chainId: number;
    scanApi?: string;
    provider: ethers.providers.Provider;
    rpcUrl: string;
    reserveTokenPrice: string;
    config: ConfigType;
    constructor(config: ConfigType);
    getTokenPrices(tokens: string[]): Promise<{}>;
}
