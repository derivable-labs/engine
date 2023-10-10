import { ethers } from 'ethers';
import { TokenType } from '../types';
import { IEngineConfig } from '../utils/configs';
import { Profile } from '../profile';
export declare class Price {
    chainId: number;
    scanApi?: string;
    provider: ethers.providers.Provider;
    rpcUrl: string;
    reserveTokenPrice: string;
    config: IEngineConfig;
    profile: Profile;
    constructor(config: IEngineConfig, profile: Profile);
    get24hChange({ baseToken, cToken, quoteToken, chainId, currentPrice, }: {
        baseToken: TokenType;
        cToken: string;
        chainId: string;
        quoteToken: TokenType;
        currentPrice: string;
    }): Promise<string>;
    getTokenPrices(tokens: string[]): Promise<{}>;
}
