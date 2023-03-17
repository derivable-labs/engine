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
var router_json_1 = __importDefault(require("../abi/router.json"));
// TODO: don't hardcode these
var fee10000 = 30;
var gasLimit = 30000000;
var Swap = /** @class */ (function () {
    function Swap(configs) {
        this.account = configs.account;
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.provider = configs.provider;
        this.signer = configs.signer;
        this.CURRENT_POOL = configs.CURRENT_POOL;
    }
    Swap.prototype.getDeleverageStep = function () {
        var _a = this.CURRENT_POOL.states, priceScaleLong = _a.priceScaleLong, twapBase = _a.twapBase;
        var _b = twapBase.lt(priceScaleLong) ?
            [twapBase, priceScaleLong] : [priceScaleLong, twapBase], amountIn = _b[0], amountOutMin = _b[1];
        return {
            idIn: (0, helper_1.bn)(constant_1.POOL_IDS.cp),
            idOut: (0, helper_1.bn)(constant_1.POOL_IDS.cp),
            amountIn: amountIn.div(2),
            amountOutMin: amountOutMin.mul(2)
        };
    };
    //
    Swap.prototype.calculateAmountOuts = function (steps, isDeleverage) {
        if (isDeleverage === void 0) { isDeleverage = false; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, stepsToSwap, value, res, result, i;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.signer)
                            return [2 /*return*/, [[(0, helper_1.bn)(0)], (0, helper_1.bn)(0)]];
                        _a = this.convertStepForPoolErc1155(this.formatSwapSteps(steps)), stepsToSwap = _a.stepsToSwap, value = _a.value;
                        if (isDeleverage) {
                            stepsToSwap.unshift(this.getDeleverageStep());
                        }
                        return [4 /*yield*/, this.callStaticMultiSwap({
                                steps: stepsToSwap,
                                gasLimit: gasLimit,
                                value: value
                            })];
                    case 1:
                        res = _b.sent();
                        result = [];
                        for (i in steps) {
                            result.push(__assign(__assign({}, steps[i]), { amountOut: res[0][i] }));
                        }
                        return [2 /*return*/, [result, (0, helper_1.bn)(gasLimit).sub(res.gasLeft)]];
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
        var steps = _a.steps, value = _a.value, gasLimit = _a.gasLimit;
        return __awaiter(this, void 0, void 0, function () {
            var contract;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        contract = this.getRouterContract(this.signer);
                        return [4 /*yield*/, contract.callStatic.multiSwap({
                                pool: this.CURRENT_POOL.poolAddress,
                                to: this.account,
                                deadline: new Date().getTime() + 3600000,
                                fee10000: fee10000,
                                referrer: ethers_1.ethers.utils.hexZeroPad('0x00', 32)
                            }, steps, {
                                value: value || (0, helper_1.bn)(0),
                                gasLimit: gasLimit || undefined
                            })];
                    case 1: return [2 /*return*/, _b.sent()];
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
    Swap.prototype.getIdByAddress = function (address) {
        try {
            if (address === this.CURRENT_POOL.baseToken)
                return (0, helper_1.bn)(this.CURRENT_POOL.baseId);
            if (address === this.CURRENT_POOL.quoteToken)
                return (0, helper_1.bn)(this.CURRENT_POOL.quoteId);
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
            var _a, stepsToSwap, value, contract, tx, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        _a = this.convertStepForPoolErc1155(__spreadArray([], steps, true)), stepsToSwap = _a.stepsToSwap, value = _a.value;
                        if (isDeleverage) {
                            stepsToSwap.unshift(this.getDeleverageStep());
                        }
                        return [4 /*yield*/, this.callStaticMultiSwap({ steps: stepsToSwap, value: value })];
                    case 1:
                        _b.sent();
                        contract = this.getRouterContract(this.signer);
                        return [4 /*yield*/, contract.multiSwap({
                                pool: this.CURRENT_POOL.poolAddress,
                                to: this.account,
                                deadline: new Date().getTime() + 3600000,
                                fee10000: fee10000,
                                referrer: ethers_1.ethers.utils.hexZeroPad('0x00', 32)
                            }, stepsToSwap, {
                                value: value
                            })];
                    case 2:
                        tx = _b.sent();
                        console.log('tx', tx);
                        return [4 /*yield*/, tx.wait(1)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 4:
                        e_1 = _b.sent();
                        console.error(e_1);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Swap.prototype.updateLeverageAndSize = function (rawStep, isDeleverage) {
        if (isDeleverage === void 0) { isDeleverage = false; }
        return __awaiter(this, void 0, void 0, function () {
            var steps, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        steps = this.formatSwapSteps(rawStep);
                        return [4 /*yield*/, this.multiSwap(steps, isDeleverage)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_2 = _a.sent();
                        console.error(e_2);
                        return [2 /*return*/, e_2];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Swap.prototype.getRouterContract = function (provider) {
        return new ethers_1.ethers.Contract(configs_1.CONFIGS[this.chainId].router, router_json_1["default"], provider);
    };
    return Swap;
}());
exports.Swap = Swap;
//# sourceMappingURL=swap.js.map