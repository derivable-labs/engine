import { BigNumber, ethers } from 'ethers';
import { UniV2Pair } from './uniV2Pair';
import { StepType, SwapStepType } from '../types';
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
    calculateAmountOuts(steps: StepType[]): Promise<(BigNumber | BigNumber[])[] | (BigNumber | {
        amountOut: any;
        tokenIn: string;
        tokenOut: string;
        amountIn: BigNumber;
    }[])[]>;
    formatSwapSteps(steps: StepType[]): SwapStepType[];
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
    updateLeverageAndSize(rawStep: StepType[], gasLimit?: BigNumber): Promise<any>;
    getAddressByErc1155Address(address: string, TOKEN_R: string): string;
    getRouterContract(provider: any): ethers.Contract;
    getStateCalHelperContract(address: string, provider?: any): ethers.Contract;
    getPoolContract(poolAddress: string, provider?: any): ethers.Contract;
    getLogicContract(provider?: any): ethers.Contract;
    getWrapContract(provider?: any): ethers.Contract;
    encodePayload(swapType: number, sideIn: BigNumber, sideOut: BigNumber, amount: BigNumber, token1155: string): string;
}
