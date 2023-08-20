export declare const SECONDS_PER_DAY = 86400;
export declare const LARGE_VALUE = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
export declare const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export declare const NATIVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export declare const fee10000 = 30;
export declare const MINI_SECOND_PER_DAY = 86400000;
export declare const LP_PRICE_UNIT = 10000;
export declare const TIME_TO_REFRESH_STATE = 30000;
export declare const CHART_API_ENDPOINT: {
    42161: string;
    8453: string;
};
export declare const LOCALSTORAGE_KEY: {
    DDL_LOGS: string;
    LAST_BLOCK_DDL_LOGS: string;
    SWAP_LOGS: string;
    SWAP_BLOCK_LOGS: string;
    TRANSFER_LOGS: string;
    TRANSFER_BLOCK_LOGS: string;
};
export declare const ddlGenesisBlock: {
    56: number;
    31337: number;
    42161: number;
    8453: number;
};
export declare const POOL_IDS: {
    cToken: number;
    cp: number;
    cw: number;
    quote: number;
    base: number;
    token0: number;
    token1: number;
    native: number;
    R: number;
    A: number;
    B: number;
    C: number;
};
export declare const EventDataAbis: {
    42161: {
        PoolCreated: string[];
        Swap: string[];
        Swap1: string[];
        Swap2: string[];
    };
    8453: {
        PoolCreated: string[];
        Swap: string[];
        Swap1: string[];
        Swap2: string[];
    };
};
