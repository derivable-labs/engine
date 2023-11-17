import { BigNumber, ethers } from 'ethers';
import { PoolType, TokenType } from '../types';
export declare const provider: ethers.providers.JsonRpcProvider;
export declare const bn: typeof BigNumber.from;
export declare const weiToNumber: (wei: any, decimal?: number, decimalToDisplay?: number) => any;
export declare const numberToWei: (number: any, decimal?: number) => any;
export declare const decodePowers: (powersBytes: string) => number[];
export declare const formatMultiCallBignumber: (data: any) => any;
export declare const getErc1155Token: (addresses: string[]) => {};
/**
 * format of erc1155 = 0xabc...abc-id
 * @param address
 */
export declare const isErc1155Address: (address: string) => boolean;
export declare const getNormalAddress: (addresses: string[]) => string[];
export declare const formatFloat: (number: number | string, decimal?: number) => string;
export declare const formatPercent: (floatNumber: any, decimal?: number) => string;
export declare const mul: (a: any, b: any, useFullwide?: boolean) => any;
export declare const sub: (a: any, b: any) => any;
export declare const div: (a: any, b: any) => any;
export declare const max: (a: any, b: any) => any;
export declare const add: (a: any, b: any) => any;
export declare const detectDecimalFromPrice: (price: number | string) => any;
export declare const packId: (kind: string, address: string) => BigNumber;
export declare const parseUq128x128: (value: BigNumber, unit?: number) => number;
export declare const parsePrice: (value: BigNumber, baseToken: TokenType, quoteToken: TokenType, pool?: PoolType) => string;
export declare const parseSqrtX96: (price: BigNumber, baseToken: TokenType, quoteToken: TokenType) => any;
export declare const mergeDeep: (target: any, ...sources: any) => any;
export declare const getTopics: () => {
    [key: string]: string[];
};
export declare function rateToHL(r: number, k: number, DURATION?: number): number;
export declare function rateFromHL(HL: number, k: number, DURATION?: number): number;
export declare const kx: (k: number, R: BigNumber, v: BigNumber, spot: BigNumber, MARK: BigNumber) => number;
export declare const STR: (num: number | string | BigNumber) => string;
export declare const NUM: (num: number | string | BigNumber) => number;
export declare const BIG: (num: number | string | BigNumber) => BigNumber;
export declare const truncate: (num: string, decimals?: number, rounding?: boolean) => string;
export declare const round: (num: string, decimals?: number) => string;
export declare const IEW: (wei: BigNumber | string, decimals?: number, decimalsToDisplay?: number) => string;
export declare const WEI: (num: number | string, decimals?: number) => string;
export declare const DIV: (a: BigNumber, b: BigNumber, precision?: number) => string;
