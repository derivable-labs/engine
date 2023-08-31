import { BigNumber } from 'ethers';
export type StepType = {
    tokenIn: string;
    tokenOut: string;
    amountIn: BigNumber;
    amountOutMin?: BigNumber;
};
export declare class PowerState {
    powers: number[];
    powersSorted: number[];
    unit: number;
    states: any;
    constructor(config: any);
    getTokenFromPower(power: number): number;
    getTokenPower(token: number): number;
    loadStates(states: any): void;
    getMarks(): {
        [key: number]: number;
    };
    getPowers(): number[];
    getPrices(): number[];
    getExposures(): number[];
    getPrice(power: number | string): number;
    calculatePrice(power: any, states?: any): number;
    findMinExposure(): number;
    findMaxExposure(): number;
    calculateExposure(power: any): number;
    calculateCompExposure(balances: any): number;
    calculateCompValue(balances: any): BigNumber;
    _searchForExposures(es: any, e: any, tolerance: any): number[];
    getOptimalBalances(V: BigNumber, E: number, tolerance?: number): {
        [x: number]: BigNumber;
    };
    valuesFromBalances(balances: {
        [key: number]: BigNumber;
    }): {
        [key: number]: BigNumber;
    };
    getBasePrice(): number;
    getCPrice(): number;
    getSwapSteps(oldBalances: {
        [key: number]: BigNumber;
    }, newExposure: number, changeAmount?: BigNumber | number, changeToken?: 'C' | 'B' | 'Q'): StepType[];
    swapAllToC(oldBalance: {
        [key: number]: BigNumber;
    }): StepType[];
    getInputBalancesAfterSwap(balances: {
        [key: number]: BigNumber;
    }, steps: StepType[]): {
        [key: number]: BigNumber;
    };
    swap(balances: {
        [key: number]: BigNumber;
    }, steps: StepType[]): {
        amountOuts: BigNumber[];
        newBalances: {
            [key: number]: BigNumber;
        };
    };
}
export declare const encodePowers: (powers: number[]) => string;
export declare const decodePowers: (powersBytes: string) => any;
export default PowerState;
