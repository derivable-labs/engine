import { ethers } from 'ethers';
import { AllowancesType, BalancesType, MaturitiesType } from '../types';
import { ConfigType } from './setConfig';
import { DerivableContractAddress } from '../utils/configs';
type BnAReturnType = {
    balances: BalancesType;
    allowances: AllowancesType;
    maturity: MaturitiesType;
};
export declare class BnA {
    chainId: number;
    account?: string;
    provider: ethers.providers.Provider;
    contractAddresses: Partial<DerivableContractAddress>;
    rpcUrl: string;
    constructor(config: ConfigType);
    getBalanceAndAllowance({ tokens }: any): Promise<BnAReturnType>;
    getBnAMulticallRequest({ erc20Tokens, erc1155Tokens, }: {
        erc20Tokens: string[];
        erc1155Tokens: {
            [key: string]: string[];
        };
    }): any;
    parseBnAMultiRes(erc20Address: any, erc1155Tokens: any, data: any): BnAReturnType;
}
export {};
