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
const constant_1 = require("../utils/constant");
const BnA_json_1 = __importDefault(require("../abi/BnA.json"));
const Token_json_1 = __importDefault(require("../abi/Token.json"));
const number_1 = require("../utils/number");
const providers_1 = require("@ethersproject/providers");
class BnA {
    constructor(config, profile) {
        this.chainId = config.chainId;
        this.account = config.account;
        this.provider = new providers_1.JsonRpcProvider(profile.configs.rpc);
        this.bnAAddress = '0x' + BnA_json_1.default.deployedBytecode.slice(-40);
        this.profile = profile;
    }
    getBalanceAndAllowance({ tokens }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.account) {
                // @ts-ignore
                this.provider.setStateOverride({
                    [this.bnAAddress]: {
                        code: BnA_json_1.default.deployedBytecode,
                    },
                });
                const multicall = new ethereum_multicall_1.Multicall({
                    multicallCustomContractAddress: this.profile.configs.helperContract.multiCall,
                    ethersProvider: this.provider,
                    tryAggregate: true,
                });
                const erc20Tokens = (0, helper_1.getNormalAddress)(tokens);
                const erc1155Tokens = (0, helper_1.getErc1155Token)(tokens);
                const multiCallRequest = this.getBnAMulticallRequest({
                    erc20Tokens,
                    erc1155Tokens,
                });
                const { results } = yield multicall.call(multiCallRequest);
                return this.parseBnAMultiRes(erc20Tokens, erc1155Tokens, results);
            }
            return { balances: {}, allowances: {}, maturity: {} };
        });
    }
    getBnAMulticallRequest({ erc20Tokens, erc1155Tokens }) {
        const packs = [];
        const accounts = [];
        for (const poolAddress in erc1155Tokens) {
            for (let side of erc1155Tokens[poolAddress]) {
                packs.push((0, helper_1.packId)(side, poolAddress));
                accounts.push(this.account);
            }
        }
        const request = [
            {
                reference: 'erc20',
                contractAddress: this.bnAAddress,
                abi: BnA_json_1.default.abi,
                calls: [
                    {
                        reference: 'bna',
                        methodName: 'getBnA',
                        methodParameters: [erc20Tokens, [this.account], [this.profile.configs.helperContract.utr]],
                    },
                ],
            },
            {
                reference: 'erc1155',
                contractAddress: this.profile.configs.derivable.token,
                abi: Token_json_1.default,
                calls: [
                    {
                        reference: 'balanceOfBatch',
                        methodName: 'balanceOfBatch',
                        methodParameters: [accounts, packs],
                    },
                    {
                        reference: 'isApprovedForAll',
                        methodName: 'isApprovedForAll',
                        methodParameters: [this.account, this.profile.configs.helperContract.utr],
                    },
                ],
            },
        ];
        for (let pack of packs) {
            request[1].calls.push({
                reference: 'maturityOf-' + pack,
                methodName: 'maturityOf',
                methodParameters: [this.account, pack],
            });
        }
        return request;
    }
    parseBnAMultiRes(erc20Address, erc1155Tokens, data) {
        var _a, _b, _c, _d;
        const maturity = {};
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
        let index = 0;
        for (let poolAddress in erc1155Tokens) {
            for (let i = 0; i < erc1155Tokens[poolAddress].length; i++) {
                const key = poolAddress + '-' + erc1155Tokens[poolAddress][i].toString();
                allowances[key] = erc1155ApproveInfo ? (0, helper_1.bn)(constant_1.LARGE_VALUE) : (0, helper_1.bn)(0);
                balances[key] = (0, helper_1.bn)((_b = (_a = erc1155BalanceInfo[index]) === null || _a === void 0 ? void 0 : _a.hex) !== null && _b !== void 0 ? _b : 0);
                ++index;
            }
        }
        for (let maturityIndex = 2; maturityIndex < data.erc1155.callsReturnContext.length; maturityIndex++) {
            const responseData = data.erc1155.callsReturnContext[maturityIndex];
            const { k, p } = (0, number_1.unpackId)((0, helper_1.bn)((_c = responseData.reference) === null || _c === void 0 ? void 0 : _c.split('-')[1]));
            maturity[p + '-' + Number(k)] = (0, helper_1.bn)((_d = responseData.returnValues[0]) === null || _d === void 0 ? void 0 : _d.hex);
        }
        return {
            balances,
            allowances,
            maturity,
        };
    }
}
exports.BnA = BnA;
//# sourceMappingURL=balanceAndAllowance.js.map