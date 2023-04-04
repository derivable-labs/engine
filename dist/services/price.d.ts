import { ethers } from "ethers";
import { TokenType } from "../types";
import { UniV2Pair } from "./uniV2Pair";
declare type ConfigType = {
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
    providerToGetLog: ethers.providers.Provider;
    UNIV2PAIR: UniV2Pair;
};
export declare class Price {
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
    providerToGetLog: ethers.providers.Provider;
    UNIV2PAIR: UniV2Pair;
    constructor(configs: ConfigType);
    get24hChangeByLog({ baseToken, quoteToken, cToken, currentPrice, baseId, headBlock, range, }: {
        baseToken: TokenType;
        cToken: string;
        quoteToken: TokenType;
        currentPrice: string;
        baseId: number;
        headBlock?: number;
        range?: number;
    }): Promise<any>;
    get24hChange({ baseToken, cToken, quoteToken, chainId, currentPrice }: {
        baseToken: TokenType;
        cToken: string;
        chainId: string;
        quoteToken: TokenType;
        currentPrice: string;
    }): Promise<number>;
    /**
     * @return price of native token
     */
    getNativePrice(): Promise<string>;
    fetchCpPrice({ states, cToken, poolAddress, cTokenPrice, }: {
        states: any;
        cToken: string;
        poolAddress: string;
        cTokenPrice: number;
    }): Promise<string>;
}
export {};
