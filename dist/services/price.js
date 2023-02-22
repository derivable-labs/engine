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
exports.Price = void 0;
var ethers_1 = require("ethers");
var constant_1 = require("../utils/constant");
var configs_1 = require("../utils/configs");
var Events_json_1 = __importDefault(require("../abi/Events.json"));
var helper_1 = require("../utils/helper");
var historyProvider_1 = __importDefault(require("../historyProvider"));
var Pool_json_1 = __importDefault(require("../abi/Pool.json"));
var SYNC_EVENT_TOPIC = '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1';
var Price = /** @class */ (function () {
    function Price(configs) {
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.provider = configs.provider;
        this.providerToGetLog = configs.providerToGetLog;
        this.UNIV2PAIR = configs.UNIV2PAIR;
    }
    Price.prototype.get24hChangeByLog = function (_a) {
        var baseToken = _a.baseToken, quoteToken = _a.quoteToken, cToken = _a.cToken, currentPrice = _a.currentPrice, baseId = _a.baseId, headBlock = _a.headBlock, _b = _a.range, range = _b === void 0 ? 40 : _b;
        return __awaiter(this, void 0, void 0, function () {
            var blocknumber24hAgo, eventInterface_1, _c, totalBaseReserve, totalQuoteReserve, price, e_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 7, , 8]);
                        if (!!headBlock) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.providerToGetLog.getBlockNumber()];
                    case 1:
                        headBlock = _d.sent();
                        _d.label = 2;
                    case 2:
                        blocknumber24hAgo = headBlock - Math.floor(constant_1.MINI_SECOND_PER_DAY / configs_1.CONFIGS[this.chainId].timePerBlock);
                        eventInterface_1 = new ethers_1.ethers.utils.Interface(Events_json_1["default"]);
                        return [4 /*yield*/, this.providerToGetLog.getLogs({
                                address: cToken,
                                fromBlock: blocknumber24hAgo - range,
                                toBlock: blocknumber24hAgo,
                                topics: [SYNC_EVENT_TOPIC]
                            }).then(function (logs) {
                                return logs.map(function (log) {
                                    var data = eventInterface_1.parseLog(log);
                                    var _a = baseId === constant_1.POOL_IDS.token0
                                        ? [data.args.reserve0, data.args.reserve1]
                                        : [data.args.reserve1, data.args.reserve0], baseReserve = _a[0], quoteReserve = _a[1];
                                    return {
                                        baseReserve: baseReserve,
                                        quoteReserve: quoteReserve
                                    };
                                });
                            }).then(function (reserves) {
                                var totalBaseReserve = (0, helper_1.bn)(0);
                                var totalQuoteReserve = (0, helper_1.bn)(0);
                                for (var i in reserves) {
                                    totalBaseReserve = totalBaseReserve.add(reserves[i].baseReserve);
                                    totalQuoteReserve = totalQuoteReserve.add(reserves[i].quoteReserve);
                                }
                                return { totalBaseReserve: totalBaseReserve, totalQuoteReserve: totalQuoteReserve };
                            })];
                    case 3:
                        _c = _d.sent(), totalBaseReserve = _c.totalBaseReserve, totalQuoteReserve = _c.totalQuoteReserve;
                        if (!(totalBaseReserve.gt(0) && totalQuoteReserve.gt(0))) return [3 /*break*/, 4];
                        price = (0, helper_1.weiToNumber)(totalQuoteReserve.mul((0, helper_1.numberToWei)(1)).div(totalBaseReserve), 18 + (quoteToken.decimal) - (baseToken.decimal));
                        return [2 /*return*/, (0, helper_1.formatPercent)((0, helper_1.div)((0, helper_1.sub)(currentPrice, price), price))];
                    case 4: return [4 /*yield*/, this.get24hChangeByLog({
                            baseToken: baseToken,
                            quoteToken: quoteToken,
                            cToken: cToken,
                            currentPrice: currentPrice,
                            baseId: baseId,
                            headBlock: headBlock,
                            range: range * 2
                        })];
                    case 5: return [2 /*return*/, _d.sent()];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_1 = _d.sent();
                        console.error(e_1);
                        return [2 /*return*/, 0];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    Price.prototype.get24hChange = function (_a) {
        var baseToken = _a.baseToken, cToken = _a.cToken, quoteToken = _a.quoteToken, currentPrice = _a.currentPrice;
        return __awaiter(this, void 0, void 0, function () {
            var toTime, result, beforePrice, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        toTime = Math.floor((new Date().getTime() - constant_1.MINI_SECOND_PER_DAY) / 1000);
                        return [4 /*yield*/, historyProvider_1["default"].getBars({
                                to: toTime,
                                limit: 1,
                                resolution: '1',
                                route: "".concat(baseToken.address, "/").concat(cToken, "/").concat(quoteToken.address),
                                outputToken: quoteToken,
                                inputToken: baseToken
                            })];
                    case 1:
                        result = _b.sent();
                        beforePrice = result[0].open;
                        return [2 /*return*/, (0, helper_1.formatPercent)((0, helper_1.div)((0, helper_1.sub)(currentPrice, beforePrice), beforePrice))];
                    case 2:
                        e_2 = _b.sent();
                        console.error(e_2);
                        return [2 /*return*/, 0];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @return price of native token
     */
    Price.prototype.getNativePrice = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, _a, wrapToken, usdToken, priceWei;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!configs_1.CONFIGS[this.chainId].wrapUsdPair) {
                            return [2 /*return*/, '0'];
                        }
                        return [4 /*yield*/, this.UNIV2PAIR.getPairInfo({
                                pairAddress: configs_1.CONFIGS[this.chainId].wrapUsdPair
                            })];
                    case 1:
                        res = _b.sent();
                        _a = res.token0.adr === configs_1.CONFIGS[this.chainId].wrapToken ? [res.token0, res.token1] : [res.token1, res.token0], wrapToken = _a[0], usdToken = _a[1];
                        priceWei = usdToken.reserve
                            .mul((0, helper_1.numberToWei)(1))
                            .div(wrapToken.reserve);
                        return [2 /*return*/, (0, helper_1.weiToNumber)(priceWei, 18 + usdToken.decimals.toNumber() - wrapToken.decimals.toNumber())];
                }
            });
        });
    };
    Price.prototype.fetchCpPrice = function (_a) {
        var states = _a.states, cToken = _a.cToken, poolAddress = _a.poolAddress, cTokenPrice = _a.cTokenPrice;
        return __awaiter(this, void 0, void 0, function () {
            var contract, cpTotalSupply, rBc, p;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!poolAddress || !cToken || !cTokenPrice || !states) {
                            return [2 /*return*/, '0'];
                        }
                        contract = new ethers_1.ethers.Contract(poolAddress, Pool_json_1["default"], this.provider);
                        return [4 /*yield*/, contract.totalSupply(constant_1.POOL_IDS.cp)];
                    case 1:
                        cpTotalSupply = _b.sent();
                        rBc = states.Rc.sub(states.rDcNeutral).sub(states.rDcLong).sub(states.rDcShort);
                        p = (0, helper_1.bn)((0, helper_1.numberToWei)(cTokenPrice)).mul(rBc).div(cpTotalSupply);
                        return [2 /*return*/, (0, helper_1.weiToNumber)(p)];
                }
            });
        });
    };
    return Price;
}());
exports.Price = Price;
//# sourceMappingURL=price.js.map