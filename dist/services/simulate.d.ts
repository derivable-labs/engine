import { BigNumber, ethers } from "ethers";
import { UniV2Pair } from "./uniV2Pair";
declare type ConfigType = {
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
    providerToGetLog: ethers.providers.Provider;
    UNIV2PAIR: UniV2Pair;
};
export declare class Simulate {
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
    providerToGetLog: ethers.providers.Provider;
    UNIV2PAIR: UniV2Pair;
    pool: any;
    constructor(configs: ConfigType);
    getAmountOut(sideIn: number, amountIn: BigNumber, sideOut: number): BigNumber;
    exactIn(price: BigNumber, sideIn: number, amountIn: BigNumber, sideOut: number): BigNumber;
    getReserveIn({ amountIn, rV, sV }: {
        amountIn: BigNumber;
        rV: BigNumber;
        sV: BigNumber;
    }): BigNumber;
    dsv({ price, R1, rV, sV }: {
        price: BigNumber;
        R1: BigNumber;
        rV: BigNumber;
        sV: BigNumber;
    }): BigNumber;
    _r(xk: BigNumber, v: BigNumber, R: BigNumber): BigNumber;
    evaluate(sideIn: number, amount: BigNumber): BigNumber;
}
export {};
