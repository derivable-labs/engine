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
        while (_) try {
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
exports.__esModule = true;
exports.overrideBnA = exports.getStorageSlotsForBnA = exports.getAllowanceSlot = exports.getBalanceSlot = void 0;
var ethers_1 = require("ethers");
var ERC20_json_1 = __importDefault(require("../abi/ERC20.json"));
var ethereum_multicall_1 = require("ethereum-multicall");
var bn = function (number) { return ethers_1.ethers.BigNumber.from(number.toString()); };
var encode = function (types, values) {
    return ethers_1.ethers.utils.defaultAbiCoder.encode(types, values);
};
var DEFAULT_ACCOUNT = "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa";
var DEFAULT_SPENDER = "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB";
function getBalanceSlot(account, i) {
    return ethers_1.ethers.utils.keccak256(encode(["address", "uint"], [account, i]));
}
exports.getBalanceSlot = getBalanceSlot;
function getAllowanceSlot(account, spender, i) {
    var firstLevelEncoded = encode(["address", "uint"], [account, i]);
    var secondLevelEncoded = encode(["address"], [spender]);
    var slot = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.concat([
        secondLevelEncoded,
        ethers_1.ethers.utils.keccak256(firstLevelEncoded),
    ]));
    return slot;
}
exports.getAllowanceSlot = getAllowanceSlot;
var getStorageSlotsForBnA = function (provider, contractAddress, account, spender, slots) {
    if (account === void 0) { account = DEFAULT_ACCOUNT; }
    if (spender === void 0) { spender = DEFAULT_SPENDER; }
    if (slots === void 0) { slots = 100; }
    return __awaiter(void 0, void 0, void 0, function () {
        var stateDiff, i, original, multicall, contractCallContext, results, data, balance, allowance;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    stateDiff = {};
                    for (i = 0; i < slots; i++) {
                        stateDiff[getBalanceSlot(account, i)] = ethers_1.ethers.utils.hexZeroPad(ethers_1.ethers.utils.hexlify(i + 1), 32);
                        stateDiff[getAllowanceSlot(account, spender, i)] =
                            ethers_1.ethers.utils.hexZeroPad(ethers_1.ethers.utils.hexlify(i + 1), 32);
                    }
                    original = provider.getStateOverride();
                    provider.setStateOverride((_a = {},
                        _a[contractAddress] = {
                            stateDiff: stateDiff
                        },
                        _a));
                    multicall = new ethereum_multicall_1.Multicall({
                        ethersProvider: provider,
                        tryAggregate: true,
                        multicallCustomContractAddress: "0x3bc605DBD3f9d8e9B6FACdfc6548f8BD3b0f0Af5"
                    });
                    contractCallContext = {
                        reference: "StorageSlot",
                        contractAddress: contractAddress,
                        abi: ERC20_json_1["default"],
                        calls: [
                            {
                                reference: "getBalance",
                                methodName: "balanceOf",
                                methodParameters: [account]
                            },
                            {
                                reference: "getAllowance",
                                methodName: "allowance",
                                methodParameters: [account, spender]
                            },
                        ]
                    };
                    return [4 /*yield*/, multicall.call(contractCallContext)];
                case 1:
                    results = _b.sent();
                    provider.setStateOverride(original);
                    data = results.results[contractCallContext.reference].callsReturnContext;
                    if (data[0].decoded == false ||
                        data[1].decoded == false ||
                        data[0].returnValues[0].hex == "0x00" ||
                        data[1].returnValues[0].hex == "0x00")
                        throw new Error("unable to find the balance slot for the first ".concat(slots, " slots"));
                    balance = bn(data[0].returnValues[0].hex).toNumber();
                    allowance = bn(data[1].returnValues[0].hex).toNumber();
                    return [2 /*return*/, {
                            balance: {
                                index: balance - 1,
                                slot: getBalanceSlot(account, balance - 1)
                            },
                            allowance: {
                                index: allowance - 1,
                                slot: getAllowanceSlot(account, spender, allowance - 1)
                            }
                        }];
            }
        });
    });
};
exports.getStorageSlotsForBnA = getStorageSlotsForBnA;
var overrideBnA = function (override) { return __awaiter(void 0, void 0, void 0, function () {
    var state, result, balance, _i, _a, spender, allowance, slot;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                state = {};
                return [4 /*yield*/, (0, exports.getStorageSlotsForBnA)(override.provider, override.token, override.account)];
            case 1:
                result = _b.sent();
                balance = ethers_1.ethers.BigNumber.from(override.balance.toString());
                balance = ethers_1.ethers.utils.hexZeroPad(balance.toHexString(), 32);
                if (override.balance) {
                    state[result.balance.slot] = balance;
                }
                if (override.allowances) {
                    for (_i = 0, _a = Object.keys(override.allowances); _i < _a.length; _i++) {
                        spender = _a[_i];
                        allowance = override.allowances[spender];
                        allowance = ethers_1.ethers.BigNumber.from(allowance.toString());
                        allowance = ethers_1.ethers.utils.hexZeroPad(allowance.toHexString(), 32);
                        slot = getAllowanceSlot(override.account, spender, result.allowance.index);
                        state[slot] = allowance;
                    }
                }
                return [2 /*return*/, state];
        }
    });
}); };
exports.overrideBnA = overrideBnA;
//# sourceMappingURL=storageSlotSearch.js.map