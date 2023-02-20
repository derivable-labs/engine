import { BigNumber, ethers } from "ethers";
import { UniV2Pair } from "./uniV2Pair";
import { PoolErc1155StepType, StepType, SwapStepType } from "../types";
import { CurrentPool } from "./currentPool";
import { JsonRpcProvider } from "@ethersproject/providers";
declare type ConfigType = {
    account?: string;
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
    overrideProvider: JsonRpcProvider;
    signer?: ethers.providers.JsonRpcSigner;
    UNIV2PAIR: UniV2Pair;
    CURRENT_POOL: CurrentPool;
};
export declare class Swap {
    account?: string;
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
    overrideProvider: JsonRpcProvider;
    signer?: ethers.providers.JsonRpcSigner;
    UNIV2PAIR: UniV2Pair;
    CURRENT_POOL: CurrentPool;
    constructor(configs: ConfigType);
    getDeleverageStep(): Promise<any>;
    calculateAmountOuts(steps: StepType[], isDeleverage?: boolean): Promise<(BigNumber | BigNumber[])[] | (BigNumber | {
        amountOut: any;
        tokenIn: string;
        tokenOut: string;
        amountIn: BigNumber;
    }[])[]>;
    formatSwapSteps(steps: StepType[]): SwapStepType[];
    callStaticMultiSwap({ params, value, gasLimit }: any): Promise<any>;
    convertStepForPoolErc1155(steps: SwapStepType[]): {
        stepsToSwap: PoolErc1155StepType[];
        value: BigNumber;
    };
    convertStepToActions(steps: SwapStepType[]): Promise<{
        params: any;
        value: BigNumber;
    }>;
    getIdByAddress(address: string): string | BigNumber;
    multiSwap(steps: SwapStepType[], isDeleverage?: boolean): Promise<boolean>;
    updateLeverageAndSize(rawStep: StepType[], isDeleverage?: boolean): Promise<any>;
    getRouterContract(provider: any): ethers.Contract;
    getPoolContract(): ethers.Contract;
    getLogicContract(provider?: any): ethers.Contract;
}
export {};
