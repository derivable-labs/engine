import { Storage } from '../types';
export interface config {
    chainId: number;
    rpcUrl: string;
    rpcToGetLogs: string;
    scanApi?: string;
    explorer?: string;
    scanName?: string;
    ddlGenesisBlock?: number;
    timePerBlock: number;
    theGraphExchange?: string;
    candleChartApi?: string;
    storage?: Storage;
    poolAddress?: string;
    nativeToken?: string;
    gasLimitDefault?: number;
    addresses: Partial<DerivableContractAddress>;
    stableCoins: string[];
}
export interface DerivableContractAddress {
    token: string;
    multiCall: string;
    reserveTokenPrice: string;
    uniswapFactory: string;
    pairsInfo: string;
    pairsV3Info: string;
    bnA: string;
    tokensInfo: string;
    router: string;
    wrapToken: string;
    wrapUsdPair: string;
    poolFactory: string;
    stateCalHelper: string;
    logic: string;
}
export declare const TESTNET_CONFIG: config;
export declare const BNB_CONFIG: config;
export declare const ARBITRUM_CONFIG: config;
export declare const BASE_CONFIG: config;
export declare const CONFIGS: {
    8453: config;
    42161: config;
};
export declare const DEFAULT_CONFIG: config;
export declare const DEFAULT_CHAIN = 42161;
