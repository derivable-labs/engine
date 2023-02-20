"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.Swap = void 0;
var ethers_1 = require("ethers");
var helper_1 = require("../utils/helper");
var constant_1 = require("../utils/constant");
var configs_1 = require("../utils/configs");
var UTR_json_1 = __importDefault(require("../abi/UTR.json"));
var Logic_json_1 = __importDefault(require("../abi/Logic.json"));
var UTROverride_json_1 = __importDefault(require("../abi/UTROverride.json"));
var Pool_json_1 = __importDefault(require("../abi/Pool.json"));
// TODO: don't hardcode these
var fee10000 = 30;
var gasLimit = 30000000;
var ACTION_RECORD_CALL_RESULT = 2;
var ACTION_INJECT_CALL_RESULT = 4;
var TRANSFER_FROM_SENDER = 0;
var Swap = /** @class */ (function () {
    function Swap(configs) {
        this.account = configs.account;
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.provider = configs.provider;
        this.overrideProvider = configs.overrideProvider;
        this.signer = configs.signer;
        this.CURRENT_POOL = configs.CURRENT_POOL;
    }
    Swap.prototype.getDeleverageStep = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, priceScaleLong, twapBase, _b, start, end, logicContract, data;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this.CURRENT_POOL.states, priceScaleLong = _a.priceScaleLong, twapBase = _a.twapBase;
                        _b = twapBase.lt(priceScaleLong) ?
                            [twapBase, priceScaleLong] : [priceScaleLong, twapBase], start = _b[0], end = _b[1];
                        logicContract = this.getLogicContract();
                        return [4 /*yield*/, logicContract.populateTransaction.deleverage(start.div(2), end.mul(2))];
                    case 1:
                        data = (_c.sent()).data;
                        return [2 /*return*/, {
                                flags: 0,
                                code: this.CURRENT_POOL.logicAddress,
                                data: data,
                                inputs: [{
                                        mode: 2,
                                        recipient: this.CURRENT_POOL.poolAddress,
                                        eip: 0,
                                        id: 0,
                                        token: constant_1.ZERO_ADDRESS,
                                        amountInMax: 0,
                                        amountSource: 0
                                    }]
                            }];
                }
            });
        });
    };
    //@ts-ignore
    Swap.prototype.calculateAmountOuts = function (steps, isDeleverage) {
        if (isDeleverage === void 0) { isDeleverage = false; }
        return __awaiter(this, void 0, void 0, function () {
            var stepsToSwap, _a, params, value, _b, _c, router, contract, res, result, i, e_1;
            var _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!this.signer)
                            return [2 /*return*/, [[(0, helper_1.bn)(0)], (0, helper_1.bn)(0)]];
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 6, , 7]);
                        stepsToSwap = __spreadArray([], steps, true).map(function (step) {
                            return __assign(__assign({}, step), { amountOutMin: 0 });
                        });
                        return [4 /*yield*/, this.convertStepToActions(stepsToSwap)];
                    case 2:
                        _a = _f.sent(), params = _a.params, value = _a.value;
                        if (!isDeleverage) return [3 /*break*/, 4];
                        _c = (_b = params[1]).unshift;
                        return [4 /*yield*/, this.getDeleverageStep()];
                    case 3:
                        _c.apply(_b, [_f.sent()]);
                        _f.label = 4;
                    case 4:
                        router = configs_1.CONFIGS[this.chainId].router;
                        // @ts-ignore
                        this.overrideProvider.setStateOverride((_d = {},
                            _d[router] = {
                                code: UTROverride_json_1["default"].deployedBytecode
                            },
                            _d));
                        contract = new ethers_1.ethers.Contract(router, UTROverride_json_1["default"].abi, this.overrideProvider);
                        return [4 /*yield*/, (_e = contract.callStatic).exec.apply(_e, __spreadArray(__spreadArray([], params, false), [{
                                    from: this.account,
                                    value: value,
                                    gasLimit: gasLimit || undefined
                                }], false))];
                    case 5:
                        res = _f.sent();
                        result = [];
                        for (i in steps) {
                            result.push(__assign(__assign({}, steps[i]), { amountOut: res[0][i] }));
                        }
                        return [2 /*return*/, [result, (0, helper_1.bn)(gasLimit).sub(res.gasLeft)]];
                    case 6:
                        e_1 = _f.sent();
                        console.log(e_1);
                        return [2 /*return*/, [[(0, helper_1.bn)(0)], (0, helper_1.bn)(0)]];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    //
    Swap.prototype.formatSwapSteps = function (steps) {
        var stepsToSwap = [];
        for (var i in steps) {
            var step = steps[i];
            var tokenIn = this.CURRENT_POOL.getTokenByPower(step.tokenIn) || step.tokenIn;
            var tokenOut = this.CURRENT_POOL.getTokenByPower(step.tokenOut) || step.tokenOut;
            if (step.amountIn.isZero() || !tokenIn || !tokenOut) {
                continue;
            }
            stepsToSwap.push({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                amountIn: step.amountIn,
                amountOutMin: 0
            });
        }
        return stepsToSwap;
    };
    Swap.prototype.callStaticMultiSwap = function (_a) {
        var params = _a.params, value = _a.value, gasLimit = _a.gasLimit;
        return __awaiter(this, void 0, void 0, function () {
            var contract;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        contract = this.getRouterContract(this.signer);
                        return [4 /*yield*/, (_b = contract.callStatic).exec.apply(_b, __spreadArray(__spreadArray([], params, false), [{
                                    value: value || (0, helper_1.bn)(0),
                                    gasLimit: gasLimit || undefined
                                }], false))];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
    Swap.prototype.convertStepForPoolErc1155 = function (steps) {
        var _this = this;
        var value = (0, helper_1.bn)(0);
        steps.forEach(function (step) {
            if (step.tokenIn === configs_1.CONFIGS[_this.chainId].nativeToken) {
                value = value.add(step.amountIn);
            }
        });
        var stepsToSwap = steps.map(function (step) {
            return {
                idIn: _this.getIdByAddress(step.tokenIn),
                idOut: _this.getIdByAddress(step.tokenOut),
                amountIn: step.amountIn,
                amountOutMin: step.amountOutMin
            };
        });
        return { stepsToSwap: stepsToSwap, value: value };
    };
    Swap.prototype.convertStepToActions = function (steps) {
        return __awaiter(this, void 0, void 0, function () {
            var poolContract, outputs, datas, actions;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        poolContract = this.getPoolContract();
                        outputs = [];
                        steps.forEach(function (step) {
                            outputs.push({
                                eip: (0, helper_1.isErc1155Address)(step.tokenOut) ? 1155 : 20,
                                token: _this.getAddressByErc1155Address(step.tokenOut),
                                id: (0, helper_1.isErc1155Address)(step.tokenOut) ? _this.getIdByAddress(step.tokenOut) : (0, helper_1.bn)(0),
                                amountOutMin: step.amountOutMin,
                                recipient: _this.account
                            });
                        });
                        return [4 /*yield*/, Promise.all(steps.map(function (step) {
                                return poolContract.populateTransaction.swap(_this.getIdByAddress(step.tokenIn), _this.getIdByAddress(step.tokenOut), _this.account);
                            }))];
                    case 1:
                        datas = _a.sent();
                        actions = steps.map(function (step, key) {
                            return {
                                flags: 0,
                                code: _this.CURRENT_POOL.poolAddress,
                                data: datas[key].data,
                                inputs: [{
                                        mode: TRANSFER_FROM_SENDER,
                                        recipient: _this.CURRENT_POOL.poolAddress,
                                        eip: (0, helper_1.isErc1155Address)(step.tokenIn) ? 1155 : 20,
                                        id: (0, helper_1.isErc1155Address)(step.tokenIn) ? _this.getIdByAddress(step.tokenIn) : 0,
                                        token: _this.getAddressByErc1155Address(step.tokenIn),
                                        amountInMax: step.amountIn,
                                        amountSource: 0
                                    }]
                            };
                        });
                        return [2 /*return*/, { params: [outputs, actions], value: (0, helper_1.bn)(0) }];
                }
            });
        });
    };
    Swap.prototype.getIdByAddress = function (address) {
        try {
            if (address === this.CURRENT_POOL.baseToken)
                return (0, helper_1.bn)(constant_1.POOL_IDS.base);
            if (address === this.CURRENT_POOL.quoteToken)
                return (0, helper_1.bn)(constant_1.POOL_IDS.quote);
            if (address === configs_1.CONFIGS[this.chainId].nativeToken)
                return constant_1.POOL_IDS.native;
            if (address === this.CURRENT_POOL.cToken)
                return (0, helper_1.bn)(constant_1.POOL_IDS.cToken);
            return (0, helper_1.bn)(address.split('-')[1]);
        }
        catch (e) {
            throw new Error('Token id not found');
        }
    };
    Swap.prototype.multiSwap = function (steps, isDeleverage) {
        if (isDeleverage === void 0) { isDeleverage = false; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, params, value, contract, res, tx, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.convertStepToActions(__spreadArray([], steps, true))];
                    case 1:
                        _a = _b.sent(), params = _a.params, value = _a.value;
                        if (isDeleverage) {
                            params.unshift(this.getDeleverageStep());
                        }
                        return [4 /*yield*/, this.callStaticMultiSwap({ params: params, value: value })];
                    case 2:
                        _b.sent();
                        contract = this.getRouterContract(this.signer);
                        return [4 /*yield*/, contract.exec.apply(contract, __spreadArray(__spreadArray([], params, false), [{
                                    value: value
                                }], false))];
                    case 3:
                        res = _b.sent();
                        return [4 /*yield*/, res.wait(1)];
                    case 4:
                        tx = _b.sent();
                        console.log('tx', tx);
                        return [2 /*return*/, true];
                    case 5:
                        e_2 = _b.sent();
                        console.error(e_2);
                        return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Swap.prototype.updateLeverageAndSize = function (rawStep, isDeleverage) {
        if (isDeleverage === void 0) { isDeleverage = false; }
        return __awaiter(this, void 0, void 0, function () {
            var steps, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        steps = this.formatSwapSteps(rawStep);
                        return [4 /*yield*/, this.multiSwap(steps, isDeleverage)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_3 = _a.sent();
                        console.error(e_3);
                        return [2 /*return*/, e_3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Swap.prototype.getAddressByErc1155Address = function (address) {
        if ((0, helper_1.isErc1155Address)(address)) {
            return address.split('-')[0];
        }
        return address;
    };
    Swap.prototype.getRouterContract = function (provider) {
        return new ethers_1.ethers.Contract(configs_1.CONFIGS[this.chainId].router, UTR_json_1["default"], provider);
    };
    Swap.prototype.getPoolContract = function () {
        return new ethers_1.ethers.Contract(this.CURRENT_POOL.poolAddress, Pool_json_1["default"], this.provider);
    };
    Swap.prototype.getLogicContract = function (provider) {
        return new ethers_1.ethers.Contract(this.CURRENT_POOL.logicAddress, Logic_json_1["default"], provider || this.provider);
    };
    return Swap;
}());
exports.Swap = Swap;
//# sourceMappingURL=swap.js.map