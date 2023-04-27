import { BigNumber } from "ethers";
import { PowerState } from 'powerLib/dist/powerLib';
import { LogType } from "../types";
import { CurrentPool } from "./currentPool";
declare type ConfigType = {
    account?: string;
    CURRENT_POOL: CurrentPool;
};
export declare class History {
    account?: string;
    CURRENT_POOL: CurrentPool;
    constructor(configs: ConfigType);
    formatSwapHistory({ logs, }: {
        logs: LogType[];
    }): {
        sideIn: BigNumber;
        sideOut: BigNumber;
        amountIn: BigNumber;
        amountOut: BigNumber;
        payer: any;
        recipient: any;
        transactionHash: string;
        timeStamp: number;
        poolIn: string;
        poolOut: string;
        tokenIn: string;
        tokenOut: string;
    }[];
    calculateLeverage(powerState: PowerState, balances: any, powers: number[]): number;
}
export {};
