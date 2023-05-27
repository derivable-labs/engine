import { BigNumber } from 'ethers';
export declare type Storage = {
    setItem?: (itemName: string, value: string) => void;
    getItem?: (itemName: string) => string;
};
export declare type ParseLogType = {
    address: string;
    name: string;
    topic: string;
    args: any;
    topics: string[];
};
export declare type LogType = {
    address: string;
    timeStamp: number;
    transactionHash: string;
    blockNumber: number;
    index: number;
    logIndex: string;
    name: string;
    topics: string[];
    args: any;
};
export declare type StatesType = {
    twapBase: BigNumber;
    twapLP: BigNumber;
    spotBase: BigNumber;
    spotLP: BigNumber;
    R: BigNumber;
    rA: BigNumber;
    rB: BigNumber;
    sA: BigNumber;
    sB: BigNumber;
    sC: BigNumber;
    Rc: BigNumber;
    Rb: BigNumber;
    Rq: BigNumber;
    priceScaleTimestamp: number;
    priceScaleLong: BigNumber;
    priceScaleShort: BigNumber;
    oracleStore: {
        basePriceCumulative: BigNumber;
        blockTimestamp: number;
        baseTWAP: {
            _x: BigNumber;
        };
    };
    oracleStoreUpdated: {
        basePriceCumulative: BigNumber;
        blockTimestamp: number;
        baseTWAP: {
            _x: BigNumber;
        };
    };
    twap: {
        base: {
            _x: BigNumber;
        };
        LP: {
            _x: BigNumber;
        };
    };
    spot: {
        base: {
            _x: BigNumber;
        };
        LP: {
            _x: BigNumber;
        };
    };
    totalSupplies: BigNumber[];
    rDcNeutral: BigNumber;
    rDcLong: BigNumber;
    rDcShort: BigNumber;
    rentRateLong: BigNumber;
    rentRateShort: BigNumber;
};
export declare type PoolConfig = {
    amountInit: BigNumber;
    recipient: string;
    k: number;
    a: BigNumber;
    b: BigNumber;
    halfLife: number;
    mark: BigNumber;
    oracle: string;
    initTime: number;
};
export declare type PoolGroupType = {
    UTR: string;
    TOKEN: string;
    pools: {
        [key: string]: PoolType;
    };
    ORACLE: string;
    k: number[];
    states: {
        twapBase: BigNumber;
        spotBase: BigNumber;
        supplyDetails: {
            [key: number]: BigNumber;
        };
        rDetails: {
            [key: number]: BigNumber;
        };
        R: BigNumber;
        rC: BigNumber;
        rDcLong: BigNumber;
        rDcShort: BigNumber;
    };
};
export declare type PoolType = {
    UTR: string;
    TOKEN: string;
    MARK: BigNumber;
    INIT_TIME: BigNumber;
    HALF_LIFE: BigNumber;
    ORACLE: string;
    TOKEN_R: string;
    pool: string;
    logic: string;
    k: BigNumber;
    cTokenPrice: number;
    baseSymbol: string;
    states: StatesType;
    baseToken: string;
    quoteToken: string;
    cToken: string;
    powers: number[];
    dTokens: string[];
    priceToleranceRatio: BigNumber;
    quoteSymbol: string;
    rentRate: BigNumber;
    deleverageRate: BigNumber;
    poolAddress: string;
    quoteId: number;
    baseId: number;
    basePrice: string;
    cPrice: number;
};
export declare type SwapLog = {
    address: string;
    args: any[];
    name: string;
};
export declare type PoolsType = {
    [key: string]: PoolType;
};
export declare type PoolGroupsType = {
    [key: string]: PoolGroupType;
};
export declare type TokenType = {
    address: string;
    decimal: number;
    name: string;
    symbol: string;
};
export declare type BalancesType = {
    [key: string]: BigNumber;
};
export declare type AllowancesType = {
    [key: string]: BigNumber;
};
export declare type PoolErc1155StepType = {
    idIn: BigNumber | string;
    idOut: BigNumber | string;
    amountIn: BigNumber;
    amountOutMin: BigNumber | string | number;
};
export declare type StepType = {
    tokenIn: string;
    tokenOut: string;
    amountIn: BigNumber;
};
export declare type SwapStepType = {
    tokenIn: string;
    tokenOut: string;
    amountIn: BigNumber;
    amountOutMin: BigNumber | string | number;
};
