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
exports.Resource = void 0;
const ethers_1 = require("ethers");
const constant_1 = require("../utils/constant");
const Events_json_1 = __importDefault(require("../abi/Events.json"));
const ethereum_multicall_1 = require("ethereum-multicall");
const configs_1 = require("../utils/configs");
const TokensInfo_json_1 = __importDefault(require("../abi/TokensInfo.json"));
const helper_1 = require("../utils/helper");
const PoolOverride_json_1 = __importDefault(require("../abi/PoolOverride.json"));
const powerLib_1 = require("powerLib/dist/powerLib");
const { AssistedJsonRpcProvider } = require('assisted-json-rpc-provider');
const MAX_BLOCK = 4294967295;
const TOPIC_APP = ethers_1.ethers.utils.formatBytes32String('DDL');
class Resource {
    constructor(configs) {
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
        this.overrideProvider = configs.overrideProvider;
    }
    fetchResourceData(account) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {};
            if (!this.chainId)
                return result;
            const [resultCached, newResource] = yield Promise.all([
                this.getResourceCached(account),
                this.getNewResource(account)
            ]);
            this.pools = Object.assign(Object.assign({}, resultCached.pools), newResource.pools);
            this.tokens = [...resultCached.tokens, ...newResource.tokens];
            this.swapLogs = [...resultCached.swapLogs, ...newResource.swapLogs];
        });
    }
    getLastBlockCached(account) {
        if (!this.storage)
            return constant_1.ddlGenesisBlock[this.chainId];
        const lastDDlBlock = Number(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS)) || constant_1.ddlGenesisBlock[this.chainId] - 1;
        let lastWalletBlock = constant_1.ddlGenesisBlock[this.chainId] - 1;
        const walletBlockCached = this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account);
        if (account && walletBlockCached) {
            lastWalletBlock = Number(walletBlockCached);
        }
        return Math.min(lastDDlBlock + 1, lastWalletBlock + 1);
    }
    cacheDdlLog({ swapLogs, ddlLogs, headBlock, account }) {
        if (!this.storage)
            return;
        const cachedDdlLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.DDL_LOGS) || '[]');
        const newCachedDdlLogs = [...ddlLogs, ...cachedDdlLogs].filter((log, index, self) => {
            return index === self.findIndex((t) => (t.logIndex === log.logIndex && t.transactionHash === log.transactionHash));
        });
        this.storage.setItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS, headBlock.toString());
        this.storage.setItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.DDL_LOGS, JSON.stringify(newCachedDdlLogs));
        if (account) {
            const cachedSwapLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account) || '[]');
            const newCacheSwapLogs = [...swapLogs, ...cachedSwapLogs].filter((log, index, self) => {
                return index === self.findIndex((t) => (t.logIndex === log.logIndex && t.transactionHash === log.transactionHash));
            });
            this.storage.setItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account, headBlock.toString());
            this.storage.setItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account, JSON.stringify(newCacheSwapLogs));
        }
    }
    getResourceCached(account) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = { pools: {}, tokens: [], swapLogs: [] };
            if (!this.storage)
                return results;
            const ddlLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.DDL_LOGS) || '[]');
            const swapLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account) || '[]');
            const [ddlLogsParsed, swapLogsParsed] = [this.parseDdlLogs(ddlLogs), this.parseDdlLogs(swapLogs)];
            if (ddlLogsParsed && ddlLogsParsed.length > 0) {
                const { tokens, pools } = yield this.generatePoolData(ddlLogsParsed);
                results.tokens = tokens;
                results.pools = pools;
            }
            if (swapLogsParsed && swapLogsParsed.length > 0) {
                results.swapLogs = swapLogsParsed;
            }
            this.pools = Object.assign(Object.assign({}, results.pools), this.pools);
            return results;
        });
    }
    getNewResource(account) {
        return __awaiter(this, void 0, void 0, function* () {
            const etherscanConfig = this.scanApi ? {
                url: this.scanApi,
                maxResults: 1000,
                rangeThreshold: 0,
                rateLimitCount: 1,
                rateLimitDuration: 5000,
                apiKeys: ['']
            } : undefined;
            const provider = new AssistedJsonRpcProvider(this.providerToGetLog, etherscanConfig);
            const lastHeadBlockCached = this.getLastBlockCached(account);
            const accTopic = account ? '0x' + '0'.repeat(24) + account.slice(2) : null;
            const topics = this.getTopics();
            const filterTopics = [
                [topics.Derivable, null, null, null],
            ];
            if (accTopic) {
                filterTopics.push([null, accTopic, null, null], [null, null, accTopic, null], [null, null, null, accTopic]);
            }
            return yield provider.getLogs({
                fromBlock: lastHeadBlockCached || 0,
                toBlock: MAX_BLOCK,
                topics: filterTopics
            }).then((logs) => {
                var _a;
                if (!(logs === null || logs === void 0 ? void 0 : logs.length)) {
                    return [[], []];
                }
                const headBlock = (_a = logs[logs.length - 1]) === null || _a === void 0 ? void 0 : _a.blockNumber;
                const topics = this.getTopics();
                const ddlLogs = logs.filter((log) => {
                    return log.address && [topics.LogicCreated, topics.PoolCreated, topics.Derivable].includes(log.topics[0]);
                });
                const swapLogs = logs.filter((log) => {
                    return log.address && [topics.Transfer, topics.TransferSingle, topics.TransferBatch, topics.Deposit].includes(log.topics[0]);
                });
                this.cacheDdlLog({
                    ddlLogs,
                    swapLogs,
                    headBlock,
                    account
                });
                return [this.parseDdlLogs(ddlLogs), this.parseDdlLogs(swapLogs)];
            }).then(([ddlLogs, swapLogs]) => __awaiter(this, void 0, void 0, function* () {
                const result = { pools: {}, tokens: [], swapLogs: [] };
                if (swapLogs && swapLogs.length > 0) {
                    result.swapLogs = swapLogs;
                }
                if (ddlLogs && ddlLogs.length > 0) {
                    const { tokens, pools } = yield this.generatePoolData(ddlLogs);
                    result.tokens = tokens;
                    result.pools = pools;
                }
                this.pools = Object.assign(Object.assign({}, result.pools), this.pools);
                return result;
            })).catch((e) => {
                console.error(e);
                return { pools: {}, tokens: [], swapLogs: [] };
            });
        });
    }
    /**
     * parse DDL logs
     * @param logs
     */
    generatePoolData(logs) {
        const allTokens = [];
        const allUniPools = [];
        const poolData = {};
        const logicData = {};
        logs.forEach((log) => {
            if (log.name === 'LogicCreated') {
                const powers = (0, helper_1.decodePowers)(log.args.powers);
                logicData[log.address] = {
                    logic: log.address,
                    dTokens: powers.map((value, key) => {
                        return { power: value, index: key };
                    }),
                    baseToken: ethers_1.ethers.utils.getAddress(log.topics[2].slice(0, 42)),
                    baseSymbol: ethers_1.ethers.utils.parseBytes32String(log.args.baseSymbol),
                    quoteSymbol: ethers_1.ethers.utils.parseBytes32String(log.args.quoteSymbol),
                    cToken: ethers_1.ethers.utils.getAddress(log.topics[3].slice(0, 42)),
                    priceToleranceRatio: log.args.priceToleranceRatio,
                    rentRate: log.args.rentRate,
                    deleverageRate: log.args.deleverageRate,
                    powers
                };
            }
        });
        logs.forEach((log) => {
            if (log.name === 'PoolCreated') {
                const logic = ethers_1.ethers.utils.getAddress(log.topics[3].slice(0, 42));
                const factory = ethers_1.ethers.utils.getAddress(log.topics[2].slice(0, 42));
                const data = log.args;
                const powers = (0, helper_1.decodePowers)(ethers_1.ethers.utils.hexZeroPad(log.args.powers.toHexString(), 32));
                data.dTokens = powers.map((value, key) => {
                    return { power: value, index: key };
                });
                data.dTokens = data.dTokens
                    .map((data) => `${log.address}-${data.index}`);
                poolData[log.address] = Object.assign(Object.assign({}, data), { poolAddress: log.address, logic,
                    factory,
                    powers, cToken: data.pairToken });
                allUniPools.push(data.pairToken);
                allTokens.push(...data.dTokens, data.pairToken, data.baseToken);
            }
        });
        return this.loadStatesData(allTokens, poolData, allUniPools);
    }
    /**
     * load Token detail, poolstate data and then dispatch to Store
     * @param listTokens
     * @param listPools
     * @param uniPools
     */
    loadStatesData(listTokens, listPools, uniPools) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const multicall = new ethereum_multicall_1.Multicall({
                multicallCustomContractAddress: configs_1.CONFIGS[this.chainId].multiCall,
                ethersProvider: this.getPoolOverridedProvider(Object.keys(listPools)),
                tryAggregate: true
            });
            const normalTokens = (0, helper_1.getNormalAddress)(listTokens);
            // @ts-ignore
            const context = this.getMultiCallRequest(normalTokens, listPools);
            const [{ results }, pairsInfo] = yield Promise.all([
                multicall.call(context),
                this.UNIV2PAIR.getPairsInfo({
                    pairAddresses: uniPools
                })
            ]);
            const { tokens: tokensArr, poolsState } = this.parseMultiCallResponse(results, Object.keys(listPools));
            const tokens = [];
            for (let i = 0; i < tokensArr.length; i++) {
                tokens.push({
                    symbol: tokensArr[i][0],
                    name: tokensArr[i][1],
                    decimal: tokensArr[i][2],
                    totalSupply: tokensArr[i][3],
                    address: normalTokens[i]
                });
            }
            const pools = Object.assign({}, listPools);
            for (const i in pools) {
                const { baseToken, powers } = pools[i];
                const pairInfo = pairsInfo[pools[i].cToken];
                const quoteToken = pairInfo.token0.adr === baseToken ? pairInfo.token1.adr : pairInfo.token0.adr;
                pools[i].quoteToken = quoteToken;
                pools[i].baseId = constant_1.POOL_IDS.base;
                pools[i].quoteId = constant_1.POOL_IDS.quote;
                pools[i].basePrice = this.getBasePrice(pairInfo, baseToken);
                pools[i].cPrice = (0, helper_1.bn)(poolsState[i].twapLP).mul(constant_1.LP_PRICE_UNIT).shr(112).toNumber() / constant_1.LP_PRICE_UNIT;
                const rdc = this.getRdc(poolsState[i], pools[i].powers, pools[i].cPrice);
                const rentRate = this.getRentRate(rdc, pools[i].rentRate);
                pools[i].states = Object.assign(Object.assign(Object.assign({}, poolsState[i]), rdc), rentRate);
                powers.forEach((power, key) => {
                    tokens.push({
                        symbol: pools[i].baseSymbol + '^' + power,
                        name: pools[i].baseSymbol + '^' + power,
                        decimal: 18,
                        totalSupply: 0,
                        address: i + '-' + key
                    });
                });
                tokens.push({
                    symbol: 'DDL-CP',
                    name: 'DDL-CP',
                    decimal: 18,
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
            }
            return { tokens, pools };
        });
    }
    getRentRate({ rDcLong, rDcShort, R }, rentRate) {
        const diff = (0, helper_1.bn)(rDcLong).sub(rDcShort).abs();
        const rate = R.isZero() ? (0, helper_1.bn)(0) : diff.mul(rentRate).div(R);
        return {
            rentRateLong: rDcLong.add(rDcShort).isZero() ? (0, helper_1.bn)(0) : rate.mul(rDcLong).div(rDcLong.add(rDcShort)),
            rentRateShort: rDcLong.add(rDcShort).isZero() ? (0, helper_1.bn)(0) : rate.mul(rDcShort).div(rDcLong.add(rDcShort))
        };
    }
    getPoolOverridedProvider(poolAddresses) {
        const stateOverride = {};
        poolAddresses.forEach((address) => {
            stateOverride[address] = {
                code: PoolOverride_json_1.default.deployedBytecode
            };
        });
        //@ts-ignore
        this.overrideProvider.setStateOverride(Object.assign({}, stateOverride));
        return this.overrideProvider;
    }
    getBasePrice(pairInfo, baseToken) {
        const token0 = pairInfo.token0.adr;
        const r0 = pairInfo.token0.reserve;
        const r1 = pairInfo.token1.reserve;
        const [rb, rq] = token0 === baseToken ? [r0, r1] : [r1, r0];
        return (0, helper_1.weiToNumber)(rq.mul((0, helper_1.numberToWei)(1)).div(rb));
    }
    /**
     * get Multicall Request to get List token and poolState data in 1 request to RPC
     * @param normalTokens
     * @param listPools
     */
    //@ts-ignore
    getMultiCallRequest(normalTokens, listPools) {
        const request = [
            {
                reference: 'tokens',
                contractAddress: configs_1.CONFIGS[this.chainId].tokensInfo,
                abi: TokensInfo_json_1.default,
                calls: [{ reference: 'tokenInfos', methodName: 'getTokenInfo', methodParameters: [normalTokens] }]
            }
        ];
        for (const i in listPools) {
            request.push({
                // @ts-ignore
                decoded: true,
                reference: 'pools-' + listPools[i].poolAddress,
                contractAddress: listPools[i].poolAddress,
                // @ts-ignore
                abi: PoolOverride_json_1.default.abi,
                calls: [{
                        reference: i,
                        methodName: 'getStates',
                        // @ts-ignore
                        methodParameters: [listPools[i].powers.length, listPools[i].cToken]
                    }]
            });
        }
        return request;
    }
    parseMultiCallResponse(multiCallData, poolAddresses) {
        const pools = {};
        const tokens = multiCallData.tokens.callsReturnContext[0].returnValues;
        poolAddresses.forEach((poolAddress) => {
            const abiInterface = new ethers_1.ethers.utils.Interface(PoolOverride_json_1.default.abi);
            const poolStateData = multiCallData['pools-' + poolAddress].callsReturnContext;
            const data = (0, helper_1.formatMultiCallBignumber)(poolStateData[0].returnValues);
            const encodeData = abiInterface.encodeFunctionResult('getStates', [data]);
            const formatedData = abiInterface.decodeFunctionResult('getStates', encodeData);
            pools[poolStateData[0].reference] = Object.assign({ twapBase: formatedData.states.twap.base._x, twapLP: formatedData.states.twap.LP._x, spotBase: formatedData.states.spot.base._x, spotLP: formatedData.states.spot.LP._x }, formatedData.states);
        });
        return { tokens, poolsState: pools };
    }
    getRdc(states, powers, cPrice) {
        const R = states.twapLP.isZero() ? (0, helper_1.bn)(0) : states.Rc.add(states.Rb.mul(states.twapBase).add(states.Rq).div(states.twapLP));
        let rDcLong = (0, helper_1.bn)(0);
        let rDcShort = (0, helper_1.bn)(0);
        const powerState = new powerLib_1.PowerState({ powers: [...powers] });
        //@ts-ignore
        powerState.loadStates(states);
        const totalSupply = states.totalSupplies;
        powers.forEach((power, id) => {
            const dPrice = powerState.getPrice(power);
            const r = dPrice || dPrice === Infinity ? (0, helper_1.bn)(0) : totalSupply[id].mul((0, helper_1.numberToWei)(dPrice)).div((0, helper_1.numberToWei)(1));
            if (power >= 0) {
                rDcLong = rDcLong.add(r);
            }
            else {
                rDcShort = rDcShort.add(r);
            }
        });
        rDcLong = cPrice ? rDcLong.mul((0, helper_1.numberToWei)(1)).div((0, helper_1.numberToWei)(cPrice)) : (0, helper_1.bn)(0);
        rDcShort = cPrice ? rDcShort.mul((0, helper_1.numberToWei)(1)).div((0, helper_1.numberToWei)(cPrice)) : (0, helper_1.bn)(0);
        return { R, rDcLong: rDcLong, rDcShort: rDcShort };
    }
    parseDdlLogs(ddlLogs) {
        const eventInterface = new ethers_1.ethers.utils.Interface(Events_json_1.default);
        return ddlLogs.map((log) => {
            try {
                const decodeLog = eventInterface.parseLog(log);
                let appName = null;
                try {
                    appName = ethers_1.ethers.utils.parseBytes32String(decodeLog.args.topic1);
                }
                catch (e) {
                }
                let data = decodeLog;
                if (appName) {
                    data = ethers_1.ethers.utils.defaultAbiCoder.decode(constant_1.EventDataAbis[appName], decodeLog.args.data);
                }
                const lastHeadBlockCached = this.getLastBlockCached(this.account || '');
                return {
                    address: log.address,
                    timeStamp: new Date().getTime() - (lastHeadBlockCached - log.blockNumber) * 3000,
                    transactionHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    index: log.logIndex,
                    logIndex: log.transactionHash + '-' + log.logIndex,
                    name: appName,
                    topics: log.topics,
                    args: Object.assign({}, data)
                };
            }
            catch (e) {
                console.error(e);
                return {};
            }
        });
    }
    getTopics() {
        const eventInterface = new ethers_1.ethers.utils.Interface(Events_json_1.default);
        const events = eventInterface.events;
        const topics = {};
        for (const i in events) {
            topics[events[i].name] = ethers_1.ethers.utils.id(i);
        }
        return topics;
    }
}
exports.Resource = Resource;
//# sourceMappingURL=resource.js.map