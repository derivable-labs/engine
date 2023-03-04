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
const Pool_json_1 = __importDefault(require("../abi/Pool.json"));
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
        const request = [
            {
                reference: 'erc20',
                contractAddress: configs_1.CONFIGS[this.chainId].bnA,
                abi: BnA_json_1.default,
                calls: [{
                        reference: 'bna', methodName: 'getBnA',
                        methodParameters: [erc20Tokens, [this.account], [configs_1.CONFIGS[this.chainId].router]]
                    }]
            }
        ];
        for (const erc1155Address in erc1155Tokens) {
            const accounts = erc1155Tokens[erc1155Address].map(() => {
                return this.account;
            });
            request.push({
                reference: 'erc1155-' + erc1155Address,
                contractAddress: erc1155Address,
                abi: Pool_json_1.default,
                calls: [
                    {
                        reference: erc1155Address, methodName: 'isApprovedForAll',
                        methodParameters: [this.account, configs_1.CONFIGS[this.chainId].router]
                    },
                    {
                        reference: erc1155Address, methodName: 'balanceOfBatch',
                        methodParameters: [accounts, erc1155Tokens[erc1155Address]]
                    }
                ]
            });
        }
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
        for (let erc1155Address in erc1155Tokens) {
            const erc1155Info = data && data['erc1155-' + erc1155Address] ? data['erc1155-' + erc1155Address].callsReturnContext : [];
            if (erc1155Info) {
                const approveData = erc1155Info.filter((e) => e.methodName === 'isApprovedForAll');
                const balanceData = erc1155Info.filter((e) => e.methodName === 'balanceOfBatch');
                for (let i = 0; i < approveData.length; i++) {
                    const callsReturnContext = approveData[i];
                    allowances[callsReturnContext.reference] = callsReturnContext.returnValues[0] ? (0, helper_1.bn)(constant_1.LARGE_VALUE) : (0, helper_1.bn)(0);
                }
                for (let i = 0; i < balanceData.length; i++) {
                    const returnValues = balanceData[i].returnValues;
                    for (let j = 0; j < returnValues.length; j++) {
                        const id = erc1155Tokens[balanceData[i].reference][j].toNumber();
                        balances[balanceData[i].reference + '-' + id] = (0, helper_1.bn)(returnValues[j]);
                    }
                }
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