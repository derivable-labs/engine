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
    calculateAmountOuts(steps: StepType[]): Promise<(BigNumber | BigNumber[])[] | (BigNumber | {
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
    multiSwap(steps: SwapStepType[], gasLimit?: BigNumber): Promise<any>;
    updateLeverageAndSize(rawStep: StepType[], gasLimit?: BigNumber): Promise<any>;
    getAddressByErc1155Address(address: string): any;
    getRouterContract(provider: any): ethers.Contract;
    getStateCalHelperContract(address: string, provider?: any): ethers.Contract;
    getPoolContract(poolAddress: string, provider?: any): ethers.Contract;
    getLogicContract(provider?: any): ethers.Contract;
    getWrapContract(provider?: any): ethers.Contract;
    encodePayload(swapType: number, sideIn: BigNumber, sideOut: BigNumber, amount: BigNumber, token1155: string): string;
}
export {};
