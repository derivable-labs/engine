import { Block } from './helper';
import { SignerFetchRpc } from './rpc-factories';
export declare function ethGetBlockByNumber(rpc: SignerFetchRpc, blockNumber: bigint | 'latest'): Promise<Block | null>;
