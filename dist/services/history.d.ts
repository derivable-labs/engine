import { BigNumber } from 'ethers';
import { PowerState } from 'powerLib/dist/powerLib';
import { LogType } from '../types';
import { CurrentPool } from './currentPool';
import { ConfigType } from './setConfig';
export declare class History {
    account?: string;
    CURRENT_POOL: CurrentPool;
    constructor(config: ConfigType & {
        CURRENT_POOL: CurrentPool;
    });
    formatSwapHistory({ logs }: {
        logs: LogType[];
    }): ({
        length: number;
        toString(): string;
        toLocaleString(): string;
        concat(...items: ConcatArray<any>[]): any[];
        concat(...items: any[]): any[];
        join(separator?: string | undefined): string;
        slice(start?: number | undefined, end?: number | undefined): any[];
        indexOf(searchElement: any, fromIndex?: number | undefined): number;
        lastIndexOf(searchElement: any, fromIndex?: number | undefined): number;
        every<S extends any>(predicate: (value: any, index: number, array: readonly any[]) => value is S, thisArg?: any): this is readonly S[];
        every(predicate: (value: any, index: number, array: readonly any[]) => unknown, thisArg?: any): boolean;
        some(predicate: (value: any, index: number, array: readonly any[]) => unknown, thisArg?: any): boolean;
        forEach(callbackfn: (value: any, index: number, array: readonly any[]) => void, thisArg?: any): void;
        map<U>(callbackfn: (value: any, index: number, array: readonly any[]) => U, thisArg?: any): U[];
        filter<S_1 extends any>(predicate: (value: any, index: number, array: readonly any[]) => value is S_1, thisArg?: any): S_1[];
        filter(predicate: (value: any, index: number, array: readonly any[]) => unknown, thisArg?: any): any[];
        reduce(callbackfn: (previousValue: any, currentValue: any, currentIndex: number, array: readonly any[]) => any): any;
        reduce(callbackfn: (previousValue: any, currentValue: any, currentIndex: number, array: readonly any[]) => any, initialValue: any): any;
        reduce<U_1>(callbackfn: (previousValue: U_1, currentValue: any, currentIndex: number, array: readonly any[]) => U_1, initialValue: U_1): U_1;
        reduceRight(callbackfn: (previousValue: any, currentValue: any, currentIndex: number, array: readonly any[]) => any): any;
        reduceRight(callbackfn: (previousValue: any, currentValue: any, currentIndex: number, array: readonly any[]) => any, initialValue: any): any;
        reduceRight<U_2>(callbackfn: (previousValue: U_2, currentValue: any, currentIndex: number, array: readonly any[]) => U_2, initialValue: U_2): U_2;
        find<S_2 extends any>(predicate: (this: void, value: any, index: number, obj: readonly any[]) => value is S_2, thisArg?: any): S_2 | undefined;
        find(predicate: (value: any, index: number, obj: readonly any[]) => unknown, thisArg?: any): any;
        findIndex(predicate: (value: any, index: number, obj: readonly any[]) => unknown, thisArg?: any): number;
        entries(): IterableIterator<[number, any]>;
        keys(): IterableIterator<number>;
        values(): IterableIterator<any>;
        includes(searchElement: any, fromIndex?: number | undefined): boolean;
        flatMap<U_3, This = undefined>(callback: (this: This, value: any, index: number, array: any[]) => U_3 | readonly U_3[], thisArg?: This | undefined): U_3[];
        flat<A, D extends number = 1>(this: A, depth?: D | undefined): FlatArray<A, D>[];
        at(index: number): any;
        [Symbol.iterator](): IterableIterator<any>;
        transactionHash: string;
        timeStamp: number;
        blockNumber: number;
        poolIn: any;
        poolOut: any;
        tokenIn: string;
        tokenOut: string;
    } | null)[];
    getTokenAddressByPoolAndSide(poolAddress: string, side: BigNumber): string;
    calculateLeverage(powerState: PowerState, balances: any, powers: number[]): number;
}