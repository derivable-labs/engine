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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BnA = void 0;
var helper_1 = require("../utils/helper");
var ethereum_multicall_1 = require("ethereum-multicall");
var configs_1 = require("../utils/configs");
var constant_1 = require("../utils/constant");
var BnA_json_1 = __importDefault(require("../abi/BnA.json"));
var Pool_json_1 = __importDefault(require("../abi/Pool.json"));
var BnA = /** @class */ (function () {
    function BnA(configs) {
        this.chainId = configs.chainId;
        this.account = configs.account;
        this.provider = configs.provider;
    }
    BnA.prototype.getBalanceAndAllowance = function (_a) {
        var tokens = _a.tokens;
        return __awaiter(this, void 0, void 0, function () {
            var multicall, erc20Tokens, erc1155Tokens, multiCallRequest, results;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.account) return [3 /*break*/, 2];
                        multicall = new ethereum_multicall_1.Multicall({
                            multicallCustomContractAddress: configs_1.CONFIGS[this.chainId].multiCall,
                            ethersProvider: this.provider,
                            tryAggregate: true
                        });
                        erc20Tokens = (0, helper_1.getNormalAddress)(tokens);
                        erc1155Tokens = (0, helper_1.getErc1155Token)(tokens);
                        multiCallRequest = this.getBnAMulticallRequest({
                            erc20Tokens: erc20Tokens,
                            erc1155Tokens: erc1155Tokens
                        });
                        return [4 /*yield*/, multicall.call(multiCallRequest)];
                    case 1:
                        results = (_b.sent()).results;
                        return [2 /*return*/, this.parseBnAMultiRes(erc20Tokens, erc1155Tokens, results)];
                    case 2: return [2 /*return*/, { balances: {}, allowances: {} }];
                }
            });
        });
    };
    BnA.prototype.getBnAMulticallRequest = function (_a) {
        var _this = this;
        var erc20Tokens = _a.erc20Tokens, erc1155Tokens = _a.erc1155Tokens;
        var request = [
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
        for (var erc1155Address in erc1155Tokens) {
            var accounts = erc1155Tokens[erc1155Address].map(function () {
                return _this.account;
            });
            request.push({
                reference: 'erc1155',
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
    };
    BnA.prototype.parseBnAMultiRes = function (erc20Address, erc1155Tokens, data) {
        var _a;
        var balances = {};
        var allowances = {};
        var erc20Info = data.erc20.callsReturnContext[0].returnValues[0];
        for (var i = 0; i < erc20Address.length; i++) {
            var address = erc20Address[i];
            balances[address] = (0, helper_1.bn)(erc20Info[i * 2]);
            allowances[address] = (0, helper_1.bn)(erc20Info[i * 2 + 1]);
        }
        var erc1155Info = (_a = data === null || data === void 0 ? void 0 : data.erc1155) === null || _a === void 0 ? void 0 : _a.callsReturnContext;
        if (erc1155Info) {
            var approveData = erc1155Info.filter(function (e) { return e.methodName === 'isApprovedForAll'; });
            var balanceData = erc1155Info.filter(function (e) { return e.methodName === 'balanceOfBatch'; });
            for (var i = 0; i < approveData.length; i++) {
                var callsReturnContext = approveData[i];
                allowances[callsReturnContext.reference] = callsReturnContext.returnValues[0] ? (0, helper_1.bn)(constant_1.LARGE_VALUE) : (0, helper_1.bn)(0);
            }
            for (var i = 0; i < balanceData.length; i++) {
                var returnValues = balanceData[i].returnValues;
                for (var j = 0; j < returnValues.length; j++) {
                    var id = erc1155Tokens[balanceData[i].reference][j].toNumber();
                    balances[balanceData[i].reference + '-' + id] = (0, helper_1.bn)(returnValues[j]);
                }
            }
        }
        return {
            balances: balances,
            allowances: allowances
        };
    };
    return BnA;
}());
exports.BnA = BnA;
//# sourceMappingURL=balanceAndAllowance.js.map