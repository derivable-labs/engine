import { ethers } from 'ethers';
import { ConfigType } from './setConfig';
import { TokenType } from "../types";
export declare class Price {
    chainId: number;
    scanApi?: string;
    provider: ethers.providers.Provider;
    rpcUrl: string;
    reserveTokenPrice: string;
    config: ConfigType;
    constructor(config: ConfigType);
    get24hChange({ baseToken, cToken, quoteToken, chainId, currentPrice, }: {
        baseToken: TokenType;
        cToken: string;
        chainId: string;
        quoteToken: TokenType;
        currentPrice: string;
    }): Promise<string>;
    getTokenPrices(tokens: string[]): Promise<{}>;
}
