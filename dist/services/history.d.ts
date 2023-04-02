import { BigNumber } from "ethers";
export declare class History {
    formatSwapHistory({ logs, poolAddress, states, powers }: any): {
        transactionHash: any;
        timeStamp: any;
        cp: BigNumber;
        oldBalances: {
            [key: number]: BigNumber;
        };
        newBalances: {
            [key: number]: BigNumber;
        };
        cAmount: BigNumber;
        newLeverage: number;
        oldLeverage: number;
    }[];
}
