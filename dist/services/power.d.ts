import { BigNumber } from 'ethers';
import { PoolType } from '../types';
export declare type StepType = {
    tokenIn: string;
    tokenOut: string;
    amountIn: BigNumber;
    amountOutMin?: BigNumber;
};
export declare class PowerState {
    k: number[];
    unit: number;
    powersSorted: number[];
    basePrice: number;
    TOKEN_R: string;
    pools: PoolType[];
    constructor(config: any);
    loadPools(poolGroup: any): void;
    getPoolByK(k: number): PoolType;
    calculateCompExposure(balances: any): number;
    calculateCompValue(balances: any): BigNumber;
    getSwapSteps(oldBalances: {
        [key: number]: BigNumber;
    }, newExposure: number, changeAmount?: BigNumber, changeToken?: string): StepType[];
    encodeBalances(balances: {
        [key: string]: BigNumber;
    }): {};
    encodeSteps(steps: {
        tokenIn: string;
        tokenOut: string;
        amountIn: BigNumber;
    }[]): {
        tokenIn: string;
        tokenOut: string;
        amountIn: BigNumber;
    }[];
    convertPowerToAddress(power: string): string;
    getInputBalancesAfterSwap(balances: {
        [key: number]: BigNumber;
    }, steps: StepType[]): {
        [key: number]: BigNumber;
    };
    getOptimalBalances(V: BigNumber, E: number, tolerance?: number): {
        [x: number]: BigNumber;
    };
    _searchForExposures(es: any, e: any, tolerance: any): number[];
    getPowers(): number[];
    getPrices(): number[];
    getCPrice(): number;
    valuesFromBalances(balances: {
        [key: number]: BigNumber;
    }): {
        [key: number]: BigNumber;
    };
    getMarks(): {
        [key: number]: number;
    };
    getExposures(): number[];
    getExposureByIdAndK(id: string, k: number): number;
    exposureToK(exposure: number): number;
    calculatePrice(power: any): number;
    calculateLongPriceByK(k: number): string;
    calculateShortPriceByK(k: number): string;
}
export default PowerState;
