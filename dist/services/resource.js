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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resource = void 0;
var ethers_1 = require("ethers");
var constant_1 = require("../utils/constant");
var Events_json_1 = __importDefault(require("../abi/Events.json"));
var ethereum_multicall_1 = require("ethereum-multicall");
var configs_1 = require("../utils/configs");
var TokensInfo_json_1 = __importDefault(require("../abi/TokensInfo.json"));
var helper_1 = require("../utils/helper");
var AssistedJsonRpcProvider = require('assisted-json-rpc-provider').AssistedJsonRpcProvider;
var MAX_BLOCK = 4294967295;
var TOPIC_APP = ethers_1.ethers.utils.formatBytes32String('DDL');
var Resource = /** @class */ (function () {
    function Resource(configs) {
        this.pools = {};
        this.tokens = [];
        this.swapLogs = [];
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.account = configs.account;
        this.storage = configs.storage;
        this.account = configs.account;
        this.providerToGetLog = configs.providerToGetLog;
        this.provider = configs.provider;
        this.UNIV2PAIR = configs.UNIV2PAIR;
    }
    Resource.prototype.fetchResourceData = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a, resultCached, newResource;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = {};
                        if (!this.chainId || !this.scanApi)
                            return [2 /*return*/, result];
                        return [4 /*yield*/, Promise.all([
                                this.getResourceCached(account),
                                this.getNewResource(account)
                            ])];
                    case 1:
                        _a = _b.sent(), resultCached = _a[0], newResource = _a[1];
                        this.pools = __assign(__assign({}, resultCached.pools), newResource.pools);
                        this.tokens = __spreadArray(__spreadArray([], resultCached.tokens, true), newResource.tokens, true);
                        this.swapLogs = __spreadArray(__spreadArray([], resultCached.swapLogs, true), newResource.swapLogs, true);
                        return [2 /*return*/];
                }
            });
        });
    };
    Resource.prototype.getLastBlockCached = function (account) {
        if (!this.storage)
            return constant_1.ddlGenesisBlock[this.chainId];
        var lastDDlBlock = Number(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS)) || constant_1.ddlGenesisBlock[this.chainId] - 1;
        var lastWalletBlock = Number(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account)) || constant_1.ddlGenesisBlock[this.chainId] - 1;
        return Math.min(lastDDlBlock + 1, lastWalletBlock + 1);
    };
    Resource.prototype.cacheDdlLog = function (_a) {
        var swapLogs = _a.swapLogs, ddlLogs = _a.ddlLogs, headBlock = _a.headBlock, account = _a.account;
        if (!this.storage)
            return;
        var cachedDdlLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.DDL_LOGS) || '[]');
        var newCachedDdlLogs = __spreadArray(__spreadArray([], ddlLogs, true), cachedDdlLogs, true).filter(function (log, index, self) {
            return index === self.findIndex(function (t) { return (t.transactionHash + t.logIndex === log.transactionHash + log.logIndex); });
        });
        this.storage.setItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS, headBlock.toString());
        this.storage.setItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.DDL_LOGS, JSON.stringify(newCachedDdlLogs));
        if (account) {
            var cachedSwapLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account) || '[]');
            var newCacheSwapLogs = __spreadArray(__spreadArray([], swapLogs, true), cachedSwapLogs, true).filter(function (log, index, self) {
                return index === self.findIndex(function (t) { return (t.transactionHash + t.logIndex === log.transactionHash + log.logIndex); });
            });
            this.storage.setItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account, headBlock.toString());
            this.storage.setItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account, JSON.stringify(newCacheSwapLogs));
        }
    };
    Resource.prototype.getResourceCached = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var results, ddlLogs, swapLogs, _a, ddlLogsParsed, swapLogsParsed, _b, tokens, pools;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        results = { pools: {}, tokens: [], swapLogs: [] };
                        if (!this.storage)
                            return [2 /*return*/, results];
                        ddlLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.DDL_LOGS) || '[]');
                        swapLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account) || '[]');
                        _a = [this.parseDdlLogs(ddlLogs), this.parseDdlLogs(swapLogs)], ddlLogsParsed = _a[0], swapLogsParsed = _a[1];
                        if (!(ddlLogsParsed && ddlLogsParsed.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.generatePoolData(ddlLogsParsed)];
                    case 1:
                        _b = _c.sent(), tokens = _b.tokens, pools = _b.pools;
                        results.tokens = tokens;
                        results.pools = pools;
                        _c.label = 2;
                    case 2:
                        if (swapLogsParsed && swapLogsParsed.length > 0) {
                            results.swapLogs = swapLogsParsed;
                        }
                        this.pools = __assign(__assign({}, results.pools), this.pools);
                        return [2 /*return*/, results];
                }
            });
        });
    };
    Resource.prototype.getNewResource = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var etherscanConfig, provider, lastHeadBlockCached, accTopic;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        etherscanConfig = this.scanApi ? {
                            url: this.scanApi,
                            maxResults: 1000,
                            rangeThreshold: 0,
                            rateLimitCount: 1,
                            rateLimitDuration: 5000,
                            apiKeys: ['']
                        } : undefined;
                        provider = new AssistedJsonRpcProvider(this.providerToGetLog, etherscanConfig);
                        lastHeadBlockCached = this.getLastBlockCached(account);
                        accTopic = account ? '0x' + '0'.repeat(24) + account.slice(2) : null;
                        return [4 /*yield*/, provider.getLogs({
                                fromBlock: lastHeadBlockCached,
                                toBlock: MAX_BLOCK,
                                topics: [
                                    null,
                                    [null, accTopic, null, null],
                                    [null, null, accTopic, null],
                                    [null, null, null, TOPIC_APP]
                                ]
                            }).then(function (logs) {
                                var _a;
                                if (!(logs === null || logs === void 0 ? void 0 : logs.length)) {
                                    return [[], []];
                                }
                                var headBlock = (_a = logs[logs.length - 1]) === null || _a === void 0 ? void 0 : _a.blockNumber;
                                var topics = _this.getTopics();
                                var ddlLogs = logs.filter(function (log) {
                                    return log.address && [topics.LogicCreated, topics.PoolCreated].includes(log.topics[0]);
                                });
                                var swapLogs = logs.filter(function (log) {
                                    return log.address && log.topics[0] === topics.MultiSwap;
                                });
                                _this.cacheDdlLog({
                                    ddlLogs: ddlLogs,
                                    swapLogs: swapLogs,
                                    headBlock: headBlock,
                                    account: account
                                });
                                return [_this.parseDdlLogs(ddlLogs), _this.parseDdlLogs(swapLogs)];
                            }).then(function (_a) {
                                var ddlLogs = _a[0], swapLogs = _a[1];
                                return __awaiter(_this, void 0, void 0, function () {
                                    var result, _b, tokens, pools;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0:
                                                result = { pools: {}, tokens: [], swapLogs: [] };
                                                if (swapLogs && swapLogs.length > 0) {
                                                    result.swapLogs = swapLogs;
                                                }
                                                if (!(ddlLogs && ddlLogs.length > 0)) return [3 /*break*/, 2];
                                                return [4 /*yield*/, this.generatePoolData(ddlLogs)];
                                            case 1:
                                                _b = _c.sent(), tokens = _b.tokens, pools = _b.pools;
                                                result.tokens = tokens;
                                                result.pools = pools;
                                                _c.label = 2;
                                            case 2:
                                                this.pools = __assign(__assign({}, result.pools), this.pools);
                                                return [2 /*return*/, result];
                                        }
                                    });
                                });
                            }).catch(function (e) {
                                console.error(e);
                                return { pools: {}, tokens: [], swapLogs: [] };
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * parse DDL logs
     * @param logs
     */
    Resource.prototype.generatePoolData = function (logs) {
        var allTokens = [];
        var allUniPools = [];
        var poolData = {};
        var logicData = {};
        logs.forEach(function (log) {
            if (log.name === 'LogicCreated') {
                var powers = (0, helper_1.decodePowers)(log.args.powers);
                logicData[log.address] = {
                    logic: log.address,
                    dTokens: powers.map(function (value, key) {
                        return { power: value, index: key };
                    }),
                    baseToken: log.args.baseToken,
                    baseSymbol: ethers_1.ethers.utils.parseBytes32String(log.args.baseSymbol),
                    quoteSymbol: ethers_1.ethers.utils.parseBytes32String(log.args.quoteSymbol),
                    cToken: log.args.cToken,
                    priceToleranceRatio: log.args.priceToleranceRatio,
                    rentRate: log.args.rentRate,
                    deleverageRate: log.args.deleverageRate,
                    powers: powers
                };
            }
        });
        logs.forEach(function (log) {
            if (log.name === 'PoolCreated') {
                var logic = log.args.logic;
                var data = logicData[logic];
                data.dTokens = data.dTokens
                    .map(function (data) { return "".concat(log.address, "-").concat(data.index); });
                poolData[log.address] = __assign({ poolAddress: log.address }, data);
                allUniPools.push(data.cToken);
                allTokens.push.apply(allTokens, __spreadArray(__spreadArray([], data.dTokens, false), [data.cToken, data.baseToken], false));
            }
        });
        return this.loadStatesData(allTokens, poolData, allUniPools);
    };
    /**
     * load Token detail, poolstate data and then dispatch to Store
     * @param listTokens
     * @param listPools
     * @param uniPools
     */
    Resource.prototype.loadStatesData = function (listTokens, listPools, uniPools) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var multicall, normalTokens, context, _c, results, pairsInfo, _d, tokensArr, poolsState, tokens, i, pools, _loop_1, this_1, i;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        multicall = new ethereum_multicall_1.Multicall({
                            multicallCustomContractAddress: configs_1.CONFIGS[this.chainId].multiCall,
                            ethersProvider: this.provider,
                            tryAggregate: true
                        });
                        normalTokens = (0, helper_1.getNormalAddress)(listTokens);
                        context = this.getMultiCallRequest(normalTokens, listPools);
                        console.log(context);
                        return [4 /*yield*/, Promise.all([
                                multicall.call(context),
                                this.UNIV2PAIR.getPairsInfo({
                                    pairAddresses: uniPools
                                })
                            ])];
                    case 1:
                        _c = _e.sent(), results = _c[0].results, pairsInfo = _c[1];
                        _d = this.parseMultiCallResponse(results), tokensArr = _d.tokens, poolsState = _d.poolsState;
                        console.log(poolsState);
                        tokens = [];
                        for (i = 0; i < tokensArr.length; i++) {
                            tokens.push({
                                symbol: tokensArr[i][0],
                                name: tokensArr[i][1],
                                decimal: tokensArr[i][2],
                                totalSupply: tokensArr[i][3],
                                address: normalTokens[i]
                            });
                        }
                        pools = __assign({}, listPools);
                        _loop_1 = function (i) {
                            var _f = pools[i], baseToken = _f.baseToken, powers = _f.powers;
                            var pairInfo = pairsInfo[pools[i].cToken];
                            var quoteToken = pairInfo.token0.adr === baseToken ? pairInfo.token1.adr : pairInfo.token0.adr;
                            var _g = pairInfo.token0.adr === baseToken ? [pairInfo.token0, pairInfo.token1] : [pairInfo.token1, pairInfo.token0], baseTokenObj = _g[0], quoteTokenObj = _g[1];
                            var _h = pairInfo.token0.adr === baseToken
                                ? [constant_1.POOL_IDS.token0, constant_1.POOL_IDS.token1]
                                : [constant_1.POOL_IDS.token1, constant_1.POOL_IDS.token0], baseId = _h[0], quoteId = _h[1];
                            pools[i].states = poolsState[i];
                            pools[i].quoteToken = quoteToken;
                            pools[i].baseId = baseId;
                            pools[i].quoteId = quoteId;
                            pools[i].basePrice = this_1.getBasePrice(pairInfo, baseToken);
                            pools[i].cPrice = (0, helper_1.bn)(pools[i].states.twapLP).mul(constant_1.LP_PRICE_UNIT).shr(112).toNumber() / constant_1.LP_PRICE_UNIT;
                            powers.forEach(function (power, key) {
                                tokens.push({
                                    symbol: pools[i].baseSymbol + '^' + power,
                                    name: pools[i].baseSymbol + '^' + power,
                                    decimal: 18 - baseTokenObj.decimals.toNumber() + quoteTokenObj.decimals.toNumber(),
                                    totalSupply: 0,
                                    address: i + '-' + key
                                });
                            });
                            tokens.push({
                                symbol: 'DDL-CP',
                                name: 'DDL-CP',
                                decimal: Math.floor((baseTokenObj.decimals.toNumber() - quoteTokenObj.decimals.toNumber()) / 2),
                                totalSupply: 0,
                                address: i + '-' + constant_1.POOL_IDS.cp
                            }, {
                                address: pairInfo.token0.adr,
                                decimal: (_a = pairInfo.token0.decimals) === null || _a === void 0 ? void 0 : _a.toNumber(),
                                name: pairInfo.token0.name,
                                symbol: pairInfo.token0.symbol,
                                totalSupply: pairInfo.token0.totalSupply
                            }, {
                                address: pairInfo.token1.adr,
                                decimal: (_b = pairInfo.token1.decimals) === null || _b === void 0 ? void 0 : _b.toNumber(),
                                name: pairInfo.token1.name,
                                symbol: pairInfo.token1.symbol,
                                totalSupply: pairInfo.token1.totalSupply
                            });
                        };
                        this_1 = this;
                        for (i in pools) {
                            _loop_1(i);
                        }
                        return [2 /*return*/, { tokens: tokens, pools: pools }];
                }
            });
        });
    };
    Resource.prototype.getBasePrice = function (pairInfo, baseTokenAddress) {
        var token0 = pairInfo.token0.adr;
        var r0 = pairInfo.token0.reserve;
        var r1 = pairInfo.token1.reserve;
        var _a = token0 === baseTokenAddress ? [pairInfo.token0, pairInfo.token1] : [pairInfo.token1, pairInfo.token0], baseToken = _a[0], quoteToken = _a[1];
        var _b = token0 === baseTokenAddress ? [r0, r1] : [r1, r0], rb = _b[0], rq = _b[1];
        return (0, helper_1.weiToNumber)(rq.mul((0, helper_1.numberToWei)(1, baseToken.decimals)).div(rb), quoteToken.decimals);
    };
    /**
     * get Multicall Request to get List token and poolState data in 1 request to RPC
     * @param normalTokens
     * @param listPools
     */
    Resource.prototype.getMultiCallRequest = function (normalTokens, listPools) {
        var request = [
            {
                reference: 'tokens',
                contractAddress: configs_1.CONFIGS[this.chainId].tokensInfo,
                abi: TokensInfo_json_1.default,
                calls: [{ reference: 'tokenInfos', methodName: 'getTokenInfo', methodParameters: [normalTokens] }]
            }
        ];
        for (var i in listPools) {
            request.push({
                // @ts-ignore
                decoded: true,
                reference: 'pools',
                contractAddress: listPools[i].logic,
                // @ts-ignore
                abi: (0, helper_1.getLogicAbi)(this.chainId),
                calls: [{ reference: i, methodName: 'getStates', methodParameters: [] }]
            });
        }
        return request;
    };
    Resource.prototype.parseMultiCallResponse = function (data) {
        var abiInterface = new ethers_1.ethers.utils.Interface((0, helper_1.getLogicAbi)(this.chainId));
        var poolStateData = data.pools.callsReturnContext;
        var tokens = data.tokens.callsReturnContext[0].returnValues;
        var pools = {};
        for (var i = 0; i < poolStateData.length; i++) {
            var data_1 = (0, helper_1.formatMultiCallBignumber)(poolStateData[i].returnValues);
            var encodeData = abiInterface.encodeFunctionResult('getStates', [data_1]);
            var formatedData = abiInterface.decodeFunctionResult('getStates', encodeData);
            pools[poolStateData[i].reference] = __assign({ twapBase: formatedData.states.twap.base._x, twapLP: formatedData.states.twap.LP._x, spotBase: formatedData.states.spot.base._x, spotLP: formatedData.states.spot.LP._x }, formatedData.states);
        }
        return { tokens: tokens, poolsState: pools };
    };
    Resource.prototype.parseDdlLogs = function (ddlLogs) {
        var eventInterface = new ethers_1.ethers.utils.Interface(Events_json_1.default);
        return ddlLogs.map(function (log) {
            try {
                return __assign(__assign({}, eventInterface.parseLog(log)), { address: log.address, timeStamp: Number(log.timeStamp), transactionHash: log.transactionHash, blockNumber: log.blockNumber, index: log.logIndex, logIndex: log.transactionHash + '-' + log.logIndex });
            }
            catch (e) {
                return {};
            }
        });
    };
    Resource.prototype.getTopics = function () {
        var eventInterface = new ethers_1.ethers.utils.Interface(Events_json_1.default);
        var events = eventInterface.events;
        var topics = {};
        for (var i in events) {
            topics[events[i].name] = ethers_1.ethers.utils.id(i);
        }
        return topics;
    };
    return Resource;
}());
exports.Resource = Resource;
//# sourceMappingURL=resource.js.map