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
    getIdByAddress(address: string): BigNumber;
    multiSwap(steps: SwapStepType[], gasLimit?: BigNumber, isDeleverage?: boolean): Promise<any>;
    updateLeverageAndSize(rawStep: StepType[], gasLimit?: BigNumber, isDeleverage?: boolean): Promise<any>;
    getAddressByErc1155Address(address: string): any;
    getRouterContract(provider: any): ethers.Contract;
    getPoolContract(poolAddress: string, provider?: any): ethers.Contract;
    getLogicContract(provider?: any): ethers.Contract;
    getWrapContract(provider?: any): ethers.Contract;
}
export {};
