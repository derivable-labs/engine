import { ethers } from "ethers";
declare type ConfigType = {
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
    rpcUrl: string;
};
export declare class UniV3Pair {
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
    rpcUrl: string;
    constructor(configs: ConfigType);
    getPairInfo({ pairAddress, flag }: {
        pairAddress: string;
        flag?: string;
    }): Promise<any>;
    getPairsInfo({ pairAddresses, flag }: {
        flag?: string;
        pairAddresses: string[];
    }): Promise<{}>;
}
export {};
