import { ethers } from "ethers";
type ConfigType = {
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
};
export declare class UniV2Pair {
    chainId: number;
    scanApi: string;
    provider: ethers.providers.Provider;
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
