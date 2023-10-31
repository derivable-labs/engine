import { BigNumber, ethers } from 'ethers';
import { LogType, TokenType } from '../types';
import { Profile } from '../profile';
import { IEngineConfig } from '../utils/configs';
import { Resource } from './resource';
export declare class History {
    account?: string;
    RESOURCE: Resource;
    config: IEngineConfig;
    profile: Profile;
    constructor(config: IEngineConfig & {
        RESOURCE: Resource;
    }, profile: Profile);
    generatePositions({ tokens, logs }: {
        tokens: TokenType[];
        logs: LogType[];
    }): {};
    generatePositionBySwapLog(positions: any, tokens: TokenType[], log: LogType): any;
    formatSwapHistory({ transferLogs, swapLogs, tokens }: {
        transferLogs: LogType[];
        swapLogs: LogType[];
        tokens: TokenType[];
    }): any[];
    extractPriceR(tokenR: TokenType, tokens: TokenType[], priceR: any, log: LogType): string | undefined;
    getTokenAddressByPoolAndSide(poolAddress: string, side: BigNumber): string;
    getSwapAbi: (topic0: string) => string[];
    decodeTransferLog(data: string, topics: string[]): ethers.utils.Result;
    decodeSwapLog(abi: any, args: any): ethers.utils.Result;
}
