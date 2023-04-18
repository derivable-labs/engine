import { BigNumber } from "ethers";
export declare const FixedPoint: {
    Q112: BigNumber;
};
export declare const floatToFixed112: (n: number) => BigNumber;
export declare const fixed112ToFloat: (fixed112: BigNumber) => number;
