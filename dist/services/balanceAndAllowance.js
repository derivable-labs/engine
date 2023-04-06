"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BnA = void 0;
const helper_1 = require("../utils/helper");
const ethereum_multicall_1 = require("ethereum-multicall");
const configs_1 = require("../utils/configs");
const constant_1 = require("../utils/constant");
const BnA_json_1 = __importDefault(require("../abi/BnA.json"));
const Token_json_1 = __importDefault(require("../abi/Token.json"));
class BnA {
    constructor(configs) {
        this.chainId = configs.chainId;
        this.account = configs.account;
        this.provider = configs.provider;
    }
    getBalanceAndAllowance({ tokens }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.account) {
                const multicall = new ethereum_multicall_1.Multicall({
                    multicallCustomContractAddress: configs_1.CONFIGS[this.chainId].multiCall,
                    ethersProvider: this.provider,
                    tryAggregate: true
                });
                const erc20Tokens = (0, helper_1.getNormalAddress)(tokens);
                const erc1155Tokens = (0, helper_1.getErc1155Token)(tokens);
                const multiCallRequest = this.getBnAMulticallRequest({
                    erc20Tokens, erc1155Tokens
                });
                const { results } = yield multicall.call(multiCallRequest);
                return this.parseBnAMultiRes(erc20Tokens, erc1155Tokens, results);
            }
            return { balances: {}, allowances: {} };
        });
    }
    getBnAMulticallRequest({ erc20Tokens, erc1155Tokens }) {
        const pack = [];
        const accounts = [];
        for (const poolAddress in erc1155Tokens) {
            for (let side of erc1155Tokens[poolAddress]) {
                pack.push((0, helper_1.packId)(side, poolAddress));
                accounts.push(this.account);
            }
        }
        const request = [
            {
                reference: 'erc20',
                contractAddress: configs_1.CONFIGS[this.chainId].bnA,
                abi: BnA_json_1.default,
                calls: [{
                        reference: 'bna', methodName: 'getBnA',
                        methodParameters: [erc20Tokens, [this.account], [configs_1.CONFIGS[this.chainId].router]]
                    }]
            },
            {
                reference: 'erc1155',
                contractAddress: configs_1.CONFIGS[this.chainId].token,
                abi: Token_json_1.default,
                calls: [{
                        reference: 'balanceOfBatch', methodName: 'balanceOfBatch',
                        methodParameters: [accounts, pack]
                    },
                    {
                        reference: 'isApprovedForAll', methodName: 'isApprovedForAll',
                        methodParameters: [this.account, configs_1.CONFIGS[this.chainId].router]
                    },
                ]
            },
        ];
        return request;
    }
    parseBnAMultiRes(erc20Address, erc1155Tokens, data) {
        const balances = {};
        const allowances = {};
        const erc20Info = data.erc20.callsReturnContext[0].returnValues[0];
        for (let i = 0; i < erc20Address.length; i++) {
            const address = erc20Address[i];
            balances[address] = (0, helper_1.bn)(erc20Info[i * 2]);
            allowances[address] = (0, helper_1.bn)(erc20Info[i * 2 + 1]);
        }
        const erc1155BalanceInfo = data.erc1155.callsReturnContext[0].returnValues;
        const erc1155ApproveInfo = data.erc1155.callsReturnContext[1].returnValues[0];
        for (let poolAddress in erc1155Tokens) {
            const approveData = erc1155ApproveInfo;
            for (let i = 0; i < erc1155Tokens[poolAddress].length; i++) {
                allowances[poolAddress + '-' + erc1155Tokens[poolAddress][i].toString()] = approveData ? (0, helper_1.bn)(constant_1.LARGE_VALUE) : (0, helper_1.bn)(0);
                balances[poolAddress + '-' + erc1155Tokens[poolAddress][i].toString()] = (0, helper_1.bn)(erc1155BalanceInfo[i].hex);
            }
        }
        return {
            balances,
            allowances
        };
    }
}
exports.BnA = BnA;
//# sourceMappingURL=balanceAndAllowance.js.map