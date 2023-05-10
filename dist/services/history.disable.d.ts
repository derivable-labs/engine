import { PowerState } from 'powerLib/dist/powerLib';
import { LogType, StatesType } from "../types";
import { CurrentPool } from "./currentPool";
type ConfigType = {
    account?: string;
    CURRENT_POOL: CurrentPool;
};
export declare class History {
    account?: string;
    CURRENT_POOL: CurrentPool;
    constructor(configs: ConfigType);
    formatSwapHistory({ logs, poolAddress, states, powers }: {
        logs: LogType[];
        poolAddress: string;
        states: StatesType;
        powers: number[];
    }): any[];
    calculateLeverage(powerState: PowerState, balances: any, powers: number[]): number;
}
export {};
