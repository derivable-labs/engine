import { BigNumber } from 'ethers';
export declare const FixedPoint: {
    Q128: BigNumber;
};
export declare const floatToFixed128: (n: number) => BigNumber;
export declare const fixed128ToFloat: (fixed128: BigNumber) => number;
