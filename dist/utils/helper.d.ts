import { BigNumber, ethers } from "ethers";
export declare const provider: ethers.providers.JsonRpcProvider;
export declare const bn: typeof BigNumber.from;
export declare const weiToNumber: (wei: any, decimal?: number) => string;
export declare const numberToWei: (number: any, decimal?: number) => string;
export declare const decodePowers: (powersBytes: string) => number[];
export declare const formatMultiCallBignumber: (data: any) => any;
export declare const getLogicAbi: (chainId: number) => any;
export declare const getErc1155Token: (addresses: string[]) => {};
/**
 * format of erc1155 = 0xabc...abc-id
 * @param address
 */
export declare const isErc1155Address: (address: string) => boolean;
export declare const getNormalAddress: (addresses: string[]) => string[];
export declare const formatFloat: (number: number | string, decimal?: number | undefined) => number;
export declare const formatPercent: (floatNumber: any, decimal?: number) => number;
export declare const mul: (a: any, b: any) => string;
export declare const sub: (a: any, b: any) => string;
export declare const div: (a: any, b: any) => string;
export declare const add: (a: any, b: any) => string;
export declare const detectDecimalFromPrice: (price: number | string) => number;
