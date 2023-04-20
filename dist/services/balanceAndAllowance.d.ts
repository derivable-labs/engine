import { ethers } from 'ethers';
import { AllowancesType, BalancesType } from '../types';
type BnAReturnType = {
    balances: BalancesType;
    allowances: AllowancesType;
};
type ConfigType = {
    chainId: number;
    account?: string;
    provider: ethers.providers.Provider;
};
export declare class BnA {
    chainId: number;
    account?: string;
    provider: ethers.providers.Provider;
    constructor(configs: ConfigType);
    getBalanceAndAllowance({ tokens }: any): Promise<BnAReturnType>;
    getBnAMulticallRequest({ erc20Tokens, erc1155Tokens }: {
        erc20Tokens: string[];
        erc1155Tokens: {
            [key: string]: string[];
        };
    }): any;
    parseBnAMultiRes(erc20Address: any, erc1155Tokens: any, data: any): BnAReturnType;
}
export {};
