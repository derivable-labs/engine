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
