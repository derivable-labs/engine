import { ethers } from 'ethers';
import { TokenType } from '../types';
import { IEngineConfig } from '../utils/configs';
import { Profile } from '../profile';
import { Resource } from "./resource";
type IFetchTokenPriceParam = {
    tokenBase: string;
    tokenQuote: string;
    routes: {
        uniPool: string;
        version: number;
    }[];
};
export declare class Price {
    chainId: number;
    scanApi?: string;
    provider: ethers.providers.Provider;
    rpcUrl: string;
    reserveTokenPrice: string;
    tokenPriceByRoute: string;
    config: IEngineConfig;
    profile: Profile;
    RESOURCE: Resource;
    constructor(config: IEngineConfig & {
        RESOURCE: Resource;
    }, profile: Profile);
    get24hChange({ baseToken, cToken, quoteToken, chainId, currentPrice, }: {
        baseToken: TokenType;
        cToken: string;
        chainId: string;
        quoteToken: TokenType;
        currentPrice: string;
    }): Promise<string>;
    getTokenPriceByRoutes(): Promise<{}>;
    _genFetchTokenParams(): IFetchTokenPriceParam[];
    getTokenPrices(tokens: string[]): Promise<{}>;
}
export {};
