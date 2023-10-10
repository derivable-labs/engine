import { ethers } from 'ethers';
import { AllowancesType, BalancesType, MaturitiesType } from '../types';
import { IEngineConfig } from '../utils/configs';
import { Profile } from '../profile';
type BnAReturnType = {
    balances: BalancesType;
    allowances: AllowancesType;
    maturity: MaturitiesType;
};
export declare class BnA {
    chainId: number;
    account?: string;
    provider: ethers.providers.Provider;
    rpcUrl: string;
    bnAAddress: string;
    profile: Profile;
    constructor(config: IEngineConfig, profile: Profile);
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
