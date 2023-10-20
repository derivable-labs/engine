import { BigNumber, ethers } from 'ethers';
import { TokenType } from '../types';
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
export declare const parseSqrtSpotPrice: (value: BigNumber, token0: TokenType, token1: TokenType, quoteTokenIndex: number) => string;
export declare const parseSpotPrice: (value: BigNumber, token0: TokenType, token1: TokenType, quoteTokenIndex: number) => string;
export declare const parseSqrtX96: (price: BigNumber, baseToken: TokenType, quoteToken: TokenType) => any;
export declare const mergeDeep: (target: any, ...sources: any) => any;
export declare const getTopics: () => {
    [key: string]: string[];
};
export declare function rateToHL(r: number, k: number, DURATION?: number): number;
export declare function rateFromHL(HL: number, k: number, DURATION?: number): number;
export declare const kx: (k: number, R: BigNumber, v: BigNumber, spot: BigNumber, MARK: BigNumber, PRECISION?: number) => number;
export interface Proof {
    readonly block: Uint8Array;
    readonly accountProofNodesRlp: Uint8Array;
    readonly reserveAndTimestampProofNodesRlp: Uint8Array;
    readonly priceAccumulatorProofNodesRlp: Uint8Array;
}
export type ProofResult = {
    readonly accountProof: readonly Uint8Array[];
    readonly storageProof: readonly {
        readonly key: bigint;
        readonly value: bigint;
        readonly proof: readonly Uint8Array[];
    }[];
};
export type Block = {
    readonly parentHash: bigint;
    readonly sha3Uncles: bigint;
    readonly miner: bigint;
    readonly stateRoot: bigint;
    readonly transactionsRoot: bigint;
    readonly receiptsRoot: bigint;
    readonly logsBloom: bigint;
    readonly difficulty: bigint;
    readonly number: bigint;
    readonly gasLimit: bigint;
    readonly gasUsed: bigint;
    readonly timestamp: bigint;
    readonly extraData: Uint8Array;
    readonly mixHash: bigint | undefined;
    readonly nonce: bigint | null;
    readonly baseFeePerGas: bigint | null;
};
export type EthGetStorageAt = (address: bigint, position: bigint, block: bigint | 'latest') => Promise<bigint>;
export type EthGetProof = (address: bigint, positions: readonly bigint[], block: bigint) => Promise<ProofResult>;
export type EthGetBlockByNumber = (blockNumber: bigint | 'latest') => Promise<Block | null>;
export declare function addressToString(value: bigint): string;
export declare function getPrice(eth_getStorageAt: EthGetStorageAt, eth_getBlockByNumber: EthGetBlockByNumber, exchangeAddress: bigint, quoteTokenIndex: number, blockNumber: bigint): Promise<bigint>;
