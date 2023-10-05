import { BigNumber, ethers } from 'ethers';
import { LogType, ParseLogType, PoolGroupsType, PoolsType, PoolType, Storage, TokenType } from '../types';
import { JsonRpcProvider } from '@ethersproject/providers';
import { UniV3Pair } from './uniV3Pair';
import { IDerivableContractAddress, IEngineConfig } from '../utils/configs';
import { Profile } from "../profile";
type ResourceData = {
    pools: PoolsType;
    tokens: TokenType[];
    swapLogs: LogType[];
    transferLogs: LogType[];
    poolGroups: any;
};
export declare class Resource {
    poolGroups: PoolGroupsType;
    pools: PoolsType;
    tokens: TokenType[];
    swapLogs: LogType[];
    transferLogs: LogType[];
    unit: number;
    chainId: number;
    scanApi?: any;
    scanApiKey?: string;
    account?: string;
    storage?: Storage;
    provider: ethers.providers.Provider;
    providerToGetLog: ethers.providers.Provider;
    overrideProvider: JsonRpcProvider;
    UNIV3PAIR: UniV3Pair;
    derivableAddress: IDerivableContractAddress;
    profile: Profile;
    stableCoins: string[];
    constructor(engineConfigs: IEngineConfig, profile: Profile);
    fetchResourceData(account: string): Promise<any>;
    getLastBlockCached(account: string): number;
    cacheDdlLog({ swapLogs, ddlLogs, transferLogs, headBlock, account, }: {
        swapLogs: any;
        ddlLogs: any;
        transferLogs: any;
        headBlock: number;
        account: string;
    }): void;
    cacheNewAccountLogs(key: string, blockKey: string, newLogs: any, headBlock: number): void;
    getResourceCached(account: string): Promise<ResourceData>;
    getNewResource(account: string): Promise<ResourceData>;
    /**
     * parse DDL logs
     * @param logs
     * @param transferLogs
     */
    generatePoolData(logs: ParseLogType[], transferLogs: ParseLogType[]): Promise<{
        tokens: TokenType[];
        pools: any;
        poolGroups: any;
    }>;
    /**
     * load Token detail, poolstate data and then dispatch to Store
     * @param listTokens
     * @param listPools
     * @param uniPools
     */
    loadStatesData(listTokens: string[], listPools: {
        [key: string]: PoolType;
    }, uniPools: string[]): Promise<{
        tokens: TokenType[];
        pools: any;
        poolGroups: any;
    }>;
    getRentRate({ rDcLong, rDcShort, R, }: {
        R: BigNumber;
        rDcLong: BigNumber;
        rDcShort: BigNumber;
    }, rentRate: BigNumber): {
        rentRateLong: BigNumber;
        rentRateShort: BigNumber;
    };
    getPoolOverridedProvider(): JsonRpcProvider;
    /**
     * get Multicall Request to get List token and poolState data in 1 request to RPC
     * @param normalTokens
     * @param listPools
     */
    getMultiCallRequest(normalTokens: string[], listPools: {
        [key: string]: PoolType;
    }): any;
    parseMultiCallResponse(multiCallData: any, poolAddresses: string[]): {
        tokens: any;
        poolsState: {};
    };
    calcPoolInfo(pool: PoolType): {
        sides: {
            [x: number]: any;
        };
        riskFactor: any;
        deleverageRiskA: number;
        deleverageRiskB: number;
        interestRate: number;
        maxPremiumRate: number;
    };
    getRdc(pools: any): {
        supplyDetails: any;
        rDetails: any;
        R: BigNumber;
        rC: BigNumber;
        rDcLong: BigNumber;
        rDcShort: BigNumber;
    };
    parseDdlLogs(ddlLogs: any): any;
}
export {};
