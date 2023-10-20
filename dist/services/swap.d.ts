import { BigNumber, Contract, ethers } from 'ethers';
import { PoolType, SwapStepType, PendingSwapTransactionType } from '../types';
import { JsonRpcProvider, TransactionReceipt } from '@ethersproject/providers';
import { Profile } from '../profile';
import { IDerivableContractAddress, IEngineConfig } from '../utils/configs';
import { Resource } from './resource';
export declare class Swap {
    account?: string;
    chainId: number;
    scanApi?: string;
    provider: ethers.providers.Provider;
    providerGetProof: JsonRpcProvider;
    overrideProvider: JsonRpcProvider;
    signer?: ethers.providers.JsonRpcSigner;
    RESOURCE: Resource;
    config: IEngineConfig;
    profile: Profile;
    derivableAdr: IDerivableContractAddress;
    pendingTxs: PendingSwapTransactionType[];
    constructor(config: IEngineConfig & {
        RESOURCE: Resource;
    }, profile: Profile);
    calculateAmountOuts(steps: SwapStepType[], fetcherV2?: boolean): Promise<any>;
    callStaticMultiSwap({ params, value, gasLimit }: any): Promise<any>;
    convertStepToActions(steps: SwapStepType[], submitFetcherV2: boolean, isCalculate?: boolean): Promise<{
        params: any;
        value: BigNumber;
    }>;
    getSweepCallData({ step, poolGroup, poolIn, poolOut, idIn, idOut, }: {
        step: any;
        poolGroup: any;
        poolIn: string;
        poolOut: string;
        idIn: BigNumber;
        idOut: BigNumber;
    }): {
        inputs: ({
            mode: number;
            eip: number;
            token: string;
            id: number | BigNumber;
            amountIn: BigNumber;
            recipient: string;
        } | {
            mode: number;
            eip: number;
            token: string;
            id: BigNumber;
            amountIn: any;
            recipient: string;
        })[];
        populateTxData: Promise<ethers.PopulatedTransaction>[];
    };
    getSwapCallData({ step, poolGroup, poolIn, poolOut, idIn, idOut, }: {
        step: SwapStepType;
        poolGroup: any;
        poolIn: string;
        poolOut: string;
        idIn: BigNumber;
        idOut: BigNumber;
    }): {
        inputs: {
            mode: number;
            eip: number;
            token: string;
            id: number | BigNumber;
            amountIn: BigNumber;
            recipient: string;
        }[];
        populateTxData: Promise<ethers.PopulatedTransaction>[];
    };
    wrapToken(address: string): string;
    generateSwapParams(method: string, params: any): Promise<ethers.PopulatedTransaction>;
    getIdByAddress(address: string, TOKEN_R: string): BigNumber;
    getPoolPoolGroup(addressIn: string, addressOut: string): {
        pools: {};
        TOKEN_R: string;
    };
    multiSwap(steps: SwapStepType[], { gasLimit, gasPrice, submitFetcherV2, onSubmitted }: {
        gasLimit?: BigNumber;
        gasPrice?: BigNumber;
        submitFetcherV2?: boolean;
        onSubmitted?: (pendingTx: PendingSwapTransactionType) => void;
    }): Promise<TransactionReceipt>;
    getAddressByErc1155Address(address: string, TOKEN_R: string): string;
    getRouterContract(provider: any): Contract;
    getStateCalHelperContract(provider?: any): Contract;
    getIndexR(tokenR: string): BigNumber;
    getUniPool(tokenIn: string, tokenR: string): string;
    fetchPriceTx(pool: PoolType, blockNumber?: number): Promise<{
        inputs: never[];
        code: string;
        data: string | undefined;
    }>;
    fetchPriceMockTx(pool: PoolType, blockNumber?: number): Promise<{
        inputs: never[];
        code: string;
        data: string | undefined;
    }>;
    getOverrideProvider(): JsonRpcProvider;
}
