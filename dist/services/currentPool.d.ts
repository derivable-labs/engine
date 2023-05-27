import { Resource } from './resource';
import { BigNumber } from 'ethers';
import { ConfigType } from './setConfig';
import { PoolType } from '../types';
export declare type PoolData = {
    baseToken: string;
    quoteToken: string;
    cToken: string;
    dTokens: string[];
    cTokenPrice: number;
    states: any;
    powers: number[];
    basePrice: string;
    poolAddress: string;
    baseId: number;
    quoteId: number;
    logic: string;
};
export declare class CurrentPool {
    resource: Resource;
    pools: {
        [key: string]: PoolType;
    };
    baseToken: string;
    quoteToken: string;
    cToken: string;
    TOKEN: string;
    dTokens: string[];
    logicAddress?: string;
    cTokenPrice: number;
    states: any;
    powers: number[];
    basePrice: string;
    poolAddress?: string;
    baseId: number;
    quoteId: number;
    chainId: number;
    config: ConfigType;
    constructor(config: ConfigType);
    setPoolAddress(address: string): void;
    initCurrentPoolData(poolData: PoolData): void;
    getTokenByPower(power: number | string): string | undefined;
    getIdByAddress(address: string): BigNumber;
}
