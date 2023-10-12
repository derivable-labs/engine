import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc';
type PartiallyRequired<T, TKeys extends keyof T> = T & {
    [P in TKeys]-?: T[P];
};
export type SignerFetchRpc = PartiallyRequired<FetchJsonRpc, 'addressProvider' | 'signatureProvider'>;
export declare function createMnemonicRpc(jsonRpcHttpEndpoint: string, gasPrice: bigint): Promise<SignerFetchRpc>;
export declare function createMemoryRpc(jsonRpcHttpEndpoint: string, gasPrice: bigint): Promise<SignerFetchRpc>;
export {};
