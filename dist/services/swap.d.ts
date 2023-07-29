import { BigNumber, Contract, ethers } from 'ethers';
import { UniV2Pair } from './uniV2Pair';
import { SwapStepType } from '../types';
import { CurrentPool } from './currentPool';
import { JsonRpcProvider } from '@ethersproject/providers';
import { ConfigType } from './setConfig';
export declare class Swap {
    account?: string;
    chainId: number;
    scanApi?: string;
    provider: ethers.providers.Provider;
    overrideProvider: JsonRpcProvider;
    signer?: ethers.providers.JsonRpcSigner;
    UNIV2PAIR: UniV2Pair;
    CURRENT_POOL: CurrentPool;
    config: ConfigType;
    constructor(config: ConfigType & {
        CURRENT_POOL: CurrentPool;
    });
    calculateAmountOuts(steps: SwapStepType[]): Promise<(BigNumber | BigNumber[])[] | (BigNumber | {
        amountOut: any;
        tokenIn: string;
        tokenOut: string;
        amountIn: BigNumber;
        amountOutMin: string | number | BigNumber;
        useSweep?: boolean | undefined;
        currentBalanceOut?: BigNumber | undefined;
        index_R?: BigNumber | undefined;
    }[])[]>;
    callStaticMultiSwap({ params, value, gasLimit }: any): Promise<any>;
    convertStepToActions(steps: SwapStepType[]): Promise<{
        params: any;
        value: BigNumber;
    }>;
    getIdByAddress(address: string, TOKEN_R: string): BigNumber;
    getPoolPoolGroup(addressIn: string, addressOut: string): {
        pools: {};
        TOKEN_R: string;
    };
    multiSwap(steps: SwapStepType[], gasLimit?: BigNumber): Promise<any>;
    getAddressByErc1155Address(address: string, TOKEN_R: string): string;
    getRouterContract(provider: any): Contract;
    getStateCalHelperContract(address: string, provider?: any): Contract;
    getPoolContract(poolAddress: string, provider?: any): Contract;
    getLogicContract(provider?: any): Contract;
    getWrapContract(provider?: any): Contract;
    encodePayload(swapType: number, sideIn: BigNumber, sideOut: BigNumber, amount: BigNumber): string;
}
