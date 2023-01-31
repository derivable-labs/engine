import { BigNumber } from "ethers";
export declare type Storage = {
    setItem: (itemName: string, value: string) => void;
    getItem: (itemName: string) => string;
};
export declare type ParseLogType = {
    address: string;
    name: string;
    topic: string;
    args: any;
};
export declare type PoolType = {
    pool: string;
    logic: string;
    cTokenPrice: number;
    baseSymbol: string;
    states: any;
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
