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
const ethereum_multicall_1 = require("ethereum-multicall");
const helper_1 = require("../utils/helper");
const uniV2Pair_1 = require("./uniV2Pair");
const lodash_1 = __importDefault(require("lodash"));
const uniV3Pair_1 = require("./uniV3Pair");
const utils_1 = require("ethers/lib/utils");
const { AssistedJsonRpcProvider } = require('assisted-json-rpc-provider');
const MAX_BLOCK = 4294967295;
const TOPIC_APP = ethers_1.ethers.utils.formatBytes32String('DDL');
class Resource {
    constructor(config, profile) {
        var _a;
        this.poolGroups = {};
        this.pools = {};
        this.tokens = [];
        this.swapLogs = [];
        this.unit = 1000000;
        this.unit = (_a = config.unit) !== null && _a !== void 0 ? _a : this.unit;
        this.chainId = config.chainId;
        this.scanApi = config.scanApi;
        this.scanApiKey = config.scanApiKey;
        this.account = config.account;
        this.storage = config.storage;
        this.account = config.account;
        this.providerToGetLog = config.providerToGetLog;
        this.provider = config.provider;
        this.UNIV2PAIR = new uniV2Pair_1.UniV2Pair(config);
        this.UNIV3PAIR = new uniV3Pair_1.UniV3Pair(config);
        this.overrideProvider = config.overrideProvider;
        this.addresses = config.addresses;
        this.profile = profile;
        this.stableCoins = (config.stableCoins || []);
    }
    fetchResourceData(account) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = {};
            if (!this.chainId)
                return result;
            const [resultCached, newResource] = yield Promise.all([
                this.getResourceCached(account),
                this.getNewResource(account),
            ]);
            this.poolGroups = Object.assign(Object.assign({}, resultCached.poolGroups), newResource.poolGroups);
            this.pools = Object.assign(Object.assign({}, resultCached.pools), newResource.pools);
            this.tokens = [...resultCached.tokens, ...newResource.tokens];
            this.swapLogs = [...resultCached.swapLogs, ...newResource.swapLogs];
        });
    }
    getLastBlockCached(account) {
        if (!this.storage || !this.storage.getItem)
            return constant_1.ddlGenesisBlock[this.chainId];
        const lastDDlBlock = Number(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS)) || constant_1.ddlGenesisBlock[this.chainId] - 1;
        let lastWalletBlock = constant_1.ddlGenesisBlock[this.chainId] - 1;
        const walletBlockCached = this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account);
        if (account && walletBlockCached) {
            lastWalletBlock = Number(walletBlockCached);
        }
        return Math.min(lastDDlBlock + 1, lastWalletBlock + 1);
    }
    cacheDdlLog({ swapLogs, ddlLogs, 
    //@ts-ignore
    transferLogs, headBlock, account, }) {
        if (!this.storage || !this.storage.getItem || !this.storage.setItem)
            return;
        const cachedDdlLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.DDL_LOGS) ||
            '[]');
        const newCachedDdlLogs = [...ddlLogs, ...cachedDdlLogs].filter((log, index, self) => {
            return (index ===
                self.findIndex((t) => t.logIndex === log.logIndex &&
                    t.transactionHash === log.transactionHash));
        });
        this.storage.setItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS, headBlock.toString());
        this.storage.setItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.DDL_LOGS, JSON.stringify(newCachedDdlLogs));
        if (account) {
            this.cacheNewAccountLogs(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account, this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account, swapLogs, headBlock);
            this.cacheNewAccountLogs(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.TRANSFER_LOGS + '-' + account, this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.TRANSFER_BLOCK_LOGS + '-' + account, transferLogs, headBlock);
        }
    }
    cacheNewAccountLogs(key, blockKey, newLogs, headBlock) {
        if (!this.storage || !this.storage.getItem || !this.storage.setItem)
            return;
        const cachedogs = JSON.parse(this.storage.getItem(key) || '[]');
        const newCacheSwapLogs = [...newLogs, ...cachedogs].filter((log, index, self) => {
            return (index ===
                self.findIndex((t) => t.logIndex === log.logIndex &&
                    t.transactionHash === log.transactionHash));
        });
        this.storage.setItem(blockKey, headBlock.toString());
        this.storage.setItem(key, JSON.stringify(newCacheSwapLogs));
    }
    getResourceCached(account) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = {
                pools: {},
                tokens: [],
                swapLogs: [],
                transferLogs: [],
                poolGroups: {},
            };
            if (!this.storage || !this.storage.getItem)
                return results;
            const ddlLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.DDL_LOGS) ||
                '[]');
            const swapLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account) || '[]');
            const transferLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + constant_1.LOCALSTORAGE_KEY.TRANSFER_LOGS + '-' + account) || '[]');
            const [ddlLogsParsed, swapLogsParsed, transferLogsParsed] = [
                this.parseDdlLogs(ddlLogs),
                this.parseDdlLogs(swapLogs),
                this.parseDdlLogs(transferLogs),
            ];
            if (ddlLogsParsed && ddlLogsParsed.length > 0) {
                const { tokens, pools, poolGroups } = yield this.generatePoolData(ddlLogsParsed, transferLogsParsed);
                results.tokens = tokens;
                results.pools = pools;
                results.poolGroups = poolGroups;
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
            // TODO: move this part to constructor
            const etherscanConfig = typeof this.scanApi === 'string' ? {
                url: this.scanApi,
                maxResults: 1000,
                rangeThreshold: 0,
                rateLimitCount: 1,
                rateLimitDuration: 5000,
                apiKeys: this.scanApiKey ? [this.scanApiKey] : []
            } : this.scanApi;
            const provider = new AssistedJsonRpcProvider(this.providerToGetLog, etherscanConfig);
            const lastHeadBlockCached = this.getLastBlockCached(account);
            const accTopic = account ? '0x' + '0'.repeat(24) + account.slice(2) : null;
            const topics = (0, helper_1.getTopics)();
            let filterTopics = [topics.Derivable[0], null, null, null];
            if (accTopic) {
                filterTopics = [
                    [topics.Derivable[0], null, null, null],
                    [null, accTopic, null, null],
                    [null, null, accTopic, null],
                    [null, null, null, accTopic],
                ];
            }
            return yield provider
                .getLogs({
                fromBlock: 0,
                toBlock: MAX_BLOCK,
                topics: filterTopics,
            })
                .then((logs) => {
                var _a;
                if (!(logs === null || logs === void 0 ? void 0 : logs.length)) {
                    return [[], [], []];
                }
                const headBlock = (_a = logs[logs.length - 1]) === null || _a === void 0 ? void 0 : _a.blockNumber;
                const ddlLogs = logs.filter((log) => {
                    return log.address
                        && topics.Derivable.includes(log.topics[0])
                        && log.address === this.addresses.poolFactory;
                });
                const swapLogs = logs.filter((log) => {
                    return log.address && topics.Swap.includes(log.topics[0]);
                });
                const transferLogs = logs.filter((log) => {
                    return log.address && topics.Transfer.includes(log.topics[0]);
                });
                this.cacheDdlLog({
                    ddlLogs,
                    swapLogs,
                    transferLogs,
                    headBlock,
                    account,
                });
                return [
                    this.parseDdlLogs(ddlLogs),
                    this.parseDdlLogs(swapLogs),
                    this.parseDdlLogs(transferLogs)
                ];
            })
                .then(([ddlLogs, swapLogs, transferLogs]) => __awaiter(this, void 0, void 0, function* () {
                const result = {
                    pools: {},
                    tokens: [],
                    swapLogs: [],
                    transferLogs: [],
                    poolGroups: {}
                };
                if (swapLogs && swapLogs.length > 0) {
                    result.swapLogs = swapLogs;
                }
                if (transferLogs && transferLogs.length > 0) {
                    result.transferLogs = transferLogs;
                }
                if (ddlLogs && ddlLogs.length > 0) {
                    const { tokens, pools, poolGroups } = yield this.generatePoolData(ddlLogs, transferLogs);
                    result.tokens = tokens;
                    result.pools = pools;
                    result.poolGroups = poolGroups;
                }
                this.pools = Object.assign(Object.assign({}, result.pools), this.pools);
                return result;
            }))
                .catch((e) => {
                console.error(e);
                return { pools: {}, tokens: [], swapLogs: [], transferLogs: [] };
            });
        });
    }
    /**
     * parse DDL logs
     * @param logs
     * @param transferLogs
     */
    generatePoolData(logs, transferLogs) {
        const allTokens = [];
        const allUniPools = [];
        const poolData = {};
        const logicData = {};
        logs.forEach((log) => {
            if (log.name === 'PoolCreated') {
                const data = log.args;
                const powers = [log.args.k.toNumber(), -log.args.k.toNumber()];
                data.dTokens = powers.map((value, key) => {
                    return { power: value, index: key };
                });
                data.dTokens = data.dTokens.map((data) => `${log.address}-${data.index}`);
                poolData[log.address] = Object.assign(Object.assign({}, data), { poolAddress: log.address, powers, cToken: data.TOKEN_R });
                const pair = ethers_1.ethers.utils.getAddress('0x' + data.ORACLE.slice(-40));
                allUniPools.push(pair);
                allTokens.push(data.TOKEN_R);
            }
        });
        transferLogs.forEach((log) => {
            allTokens.push(log.contractAddress);
        });
        allTokens.push(...this.stableCoins);
        return this.loadStatesData(allTokens, poolData, allUniPools);
    }
    /**
     * load Token detail, poolstate data and then dispatch to Store
     * @param listTokens
     * @param listPools
     * @param uniPools
     */
    //@ts-ignore
    loadStatesData(listTokens, listPools, 
    //@ts-ignore
    uniPools) {
        return __awaiter(this, void 0, void 0, function* () {
            const multicall = new ethereum_multicall_1.Multicall({
                multicallCustomContractAddress: this.addresses.multiCall,
                ethersProvider: this.getPoolOverridedProvider(),
                tryAggregate: true,
            });
            const normalTokens = lodash_1.default.uniq((0, helper_1.getNormalAddress)(listTokens));
            // @ts-ignore
            const context = this.getMultiCallRequest(normalTokens, listPools);
            const [{ results }, pairsInfo] = yield Promise.all([
                multicall.call(context),
                this.UNIV3PAIR.getPairsInfo({
                    pairAddresses: lodash_1.default.uniq(uniPools),
                }),
            ]);
            const { tokens: tokensArr, poolsState } = this.parseMultiCallResponse(results, Object.keys(listPools));
            const tokens = [];
            for (let i = 0; i < tokensArr.length; i++) {
                tokens.push({
                    symbol: tokensArr[i][0],
                    name: tokensArr[i][1],
                    decimal: tokensArr[i][2],
                    totalSupply: tokensArr[i][3],
                    address: normalTokens[i],
                });
            }
            const pools = Object.assign({}, listPools);
            const poolGroups = {};
            for (const i in pools) {
                if (!poolsState[i]) {
                    delete pools[i];
                    continue;
                }
                pools[i].states = poolsState[i];
                pools[i] = Object.assign(Object.assign({}, pools[i]), this.calcPoolInfo(pools[i]));
                const { MARK: _MARK, ORACLE, k: _k } = pools[i];
                const quoteTokenIndex = (0, helper_1.bn)(ORACLE.slice(0, 3)).gt(0) ? 1 : 0;
                const pair = ethers_1.ethers.utils.getAddress('0x' + ORACLE.slice(-40));
                const baseToken = quoteTokenIndex === 0 ? pairsInfo[pair].token1 : pairsInfo[pair].token0;
                const quoteToken = quoteTokenIndex === 0 ? pairsInfo[pair].token0 : pairsInfo[pair].token1;
                const tokenR = tokens.find((t) => t.address === pools[i].TOKEN_R);
                pools[i].baseToken = baseToken.address;
                pools[i].quoteToken = quoteToken.address;
                const k = _k.toNumber();
                const id = [pair].join('-');
                if (poolGroups[id]) {
                    poolGroups[id].pools[i] = pools[i];
                }
                else {
                    poolGroups[id] = { pools: { [i]: pools[i] } };
                    poolGroups[id].UTR = pools[i].UTR;
                    poolGroups[id].pair = pairsInfo[pair];
                    poolGroups[id].quoteTokenIndex = quoteTokenIndex;
                    poolGroups[id].baseToken = pools[i].baseToken;
                    poolGroups[id].quoteToken = pools[i].quoteToken;
                    poolGroups[id].TOKEN = pools[i].TOKEN;
                    poolGroups[id].MARK = pools[i].MARK;
                    poolGroups[id].INIT_TIME = pools[i].INIT_TIME;
                    poolGroups[id].HALF_LIFE = pools[i].HALF_LIFE;
                    poolGroups[id].ORACLE = pools[i].ORACLE;
                    poolGroups[id].TOKEN_R = pools[i].TOKEN_R;
                    poolGroups[id].states = Object.assign({ twapBase: poolsState[i].twap, spotBase: poolsState[i].spot }, poolsState[i]);
                    poolGroups[id].basePrice = (0, helper_1.parseSqrtSpotPrice)(poolsState[i].spot, baseToken, quoteToken, 1);
                }
                const rdc = this.getRdc(Object.values(poolGroups[id].pools));
                poolGroups[id].states = Object.assign(Object.assign({}, poolGroups[id].states), rdc);
                if (poolGroups[id].powers) {
                    poolGroups[id].k.push(pools[i].k.toNumber());
                    poolGroups[id].powers.push(pools[i].powers[0], pools[i].powers[1]);
                }
                else {
                    poolGroups[id].k = [pools[i].k.toNumber()];
                    poolGroups[id].powers = [...pools[i].powers];
                }
                if (poolGroups[id].dTokens) {
                    poolGroups[id].dTokens.push(pools[i].poolAddress + '-' + constant_1.POOL_IDS.A, pools[i].poolAddress + '-' + constant_1.POOL_IDS.B);
                }
                else {
                    poolGroups[id].dTokens = [
                        pools[i].poolAddress + '-' + constant_1.POOL_IDS.A,
                        pools[i].poolAddress + '-' + constant_1.POOL_IDS.B,
                    ];
                }
                if (poolGroups[id].allTokens) {
                    poolGroups[id].allTokens.push(pools[i].poolAddress + '-' + constant_1.POOL_IDS.A, pools[i].poolAddress + '-' + constant_1.POOL_IDS.B, pools[i].poolAddress + '-' + constant_1.POOL_IDS.C);
                }
                else {
                    poolGroups[id].allTokens = [
                        pools[i].poolAddress + '-' + constant_1.POOL_IDS.A,
                        pools[i].poolAddress + '-' + constant_1.POOL_IDS.B,
                        pools[i].poolAddress + '-' + constant_1.POOL_IDS.C,
                    ];
                }
                tokens.push({
                    symbol: baseToken.symbol + '^' + (1 + k / 2),
                    name: baseToken.symbol + '^' + (1 + k / 2),
                    decimal: tokenR.decimal,
                    totalSupply: 0,
                    address: pools[i].poolAddress + '-' + constant_1.POOL_IDS.A,
                }, {
                    symbol: baseToken.symbol + '^' + (1 - k / 2),
                    name: baseToken.symbol + '^' + (1 - k / 2),
                    decimal: tokenR.decimal,
                    totalSupply: 0,
                    address: pools[i].poolAddress + '-' + constant_1.POOL_IDS.B,
                }, {
                    symbol: `DLP-${baseToken.symbol}-${k / 2}`,
                    name: `DLP-${baseToken.symbol}-${k / 2}`,
                    decimal: tokenR.decimal,
                    totalSupply: 0,
                    address: pools[i].poolAddress + '-' + constant_1.POOL_IDS.C,
                }, baseToken, quoteToken);
            }
            return {
                // @ts-ignore
                tokens: lodash_1.default.uniqBy(tokens, 'address'),
                pools,
                poolGroups,
            };
        });
    }
    getRentRate({ rDcLong, rDcShort, R, }, rentRate) {
        const diff = (0, helper_1.bn)(rDcLong).sub(rDcShort).abs();
        const rate = R.isZero() ? (0, helper_1.bn)(0) : diff.mul(rentRate).div(R);
        return {
            rentRateLong: rDcLong.add(rDcShort).isZero()
                ? (0, helper_1.bn)(0)
                : rate.mul(rDcLong).div(rDcLong.add(rDcShort)),
            rentRateShort: rDcLong.add(rDcShort).isZero()
                ? (0, helper_1.bn)(0)
                : rate.mul(rDcShort).div(rDcLong.add(rDcShort)),
        };
    }
    getPoolOverridedProvider() {
        const stateOverride = {};
        // poolAddresses.forEach((address: string) => {
        stateOverride[this.addresses.logic] = {
            code: this.profile.getAbi('PoolOverride').deployedBytecode,
        };
        // })
        //@ts-ignore
        this.overrideProvider.setStateOverride(Object.assign(Object.assign({}, stateOverride), { [this.addresses.tokensInfo]: {
                code: this.profile.getAbi('TokensInfo').deployedBytecode,
            } }));
        return this.overrideProvider;
    }
    /**
     * get Multicall Request to get List token and poolState data in 1 request to RPC
     * @param normalTokens
     * @param listPools
     */
    //@ts-ignore
    getMultiCallRequest(
    // @ts-ignore
    normalTokens, 
    // @ts-ignore
    listPools) {
        const request = [
            {
                reference: 'tokens',
                contractAddress: this.addresses.tokensInfo,
                abi: this.profile.getAbi('TokensInfo').abi,
                calls: [
                    {
                        reference: 'tokenInfos',
                        methodName: 'getTokenInfo',
                        methodParameters: [normalTokens],
                    },
                ],
            },
        ];
        const poolOverrideAbi = this.profile.getAbi('PoolOverride').abi;
        for (const i in listPools) {
            request.push({
                // @ts-ignore
                decoded: true,
                reference: 'pools-' + listPools[i].poolAddress,
                contractAddress: listPools[i].poolAddress,
                // @ts-ignore
                abi: poolOverrideAbi,
                calls: [
                    {
                        reference: i,
                        methodName: 'compute',
                        methodParameters: [
                            this.addresses.token,
                        ],
                    },
                ],
            });
        }
        return request;
    }
    parseMultiCallResponse(multiCallData, poolAddresses) {
        const pools = {};
        const tokens = multiCallData.tokens.callsReturnContext[0].returnValues;
        const poolOverrideAbi = this.profile.getAbi('PoolOverride').abi;
        poolAddresses.forEach((poolAddress) => {
            try {
                const abiInterface = new ethers_1.ethers.utils.Interface(poolOverrideAbi);
                const poolStateData = multiCallData['pools-' + poolAddress].callsReturnContext;
                const data = (0, helper_1.formatMultiCallBignumber)(poolStateData[0].returnValues);
                const encodeData = abiInterface.encodeFunctionResult('compute', [data]);
                const formatedData = abiInterface.decodeFunctionResult('compute', encodeData);
                pools[poolStateData[0].reference] = Object.assign(Object.assign({}, formatedData.stateView), formatedData.stateView.state);
            }
            catch (e) {
                console.error("Cannot get states of: ", poolAddress);
                console.error(e);
            }
        });
        return { tokens, poolsState: pools };
    }
    calcPoolInfo(pool) {
        const { R, rA, rB, rC } = pool.states;
        const riskFactor = rC.gt(0) ? (0, helper_1.div)(rA.sub(rB), rC) : '0';
        const deleverageRiskA = R.isZero() ? 0 : rA.mul(2 * this.unit).div(R).toNumber() / this.unit;
        const deleverageRiskB = R.isZero() ? 0 : rB.mul(2 * this.unit).div(R).toNumber() / this.unit;
        const dailyInterestRate = 1 - Math.pow(2, -constant_1.SECONDS_PER_DAY / pool.INTEREST_HL.toNumber());
        let premium = {};
        let maxPremiumRate;
        if (pool.PREMIUM_HL) {
            // TODO: need to update after have correct PREMIUM_HL
            maxPremiumRate = (0, helper_1.toDailyRate)(Number(pool.INTEREST_HL.div(10).toString()));
            const premiumRate = Number((0, helper_1.mul)((rA.gt(rB) ? rA.sub(rB) : rB.sub(rA)), maxPremiumRate, false));
            if (rA.eq(rB)) {
                premium = { A: 0, B: 0, C: 0 };
            }
            else if (rA.gt(rB)) {
                premium = { A: (0, helper_1.div)(premiumRate, rA), B: (0, helper_1.div)(-premiumRate, rB.add(rC)), C: (0, helper_1.div)(-premiumRate, (0, helper_1.weiToNumber)(rB.add(rC))) };
            }
            else if (rB.gt(rA)) {
                premium = { A: (0, helper_1.div)(-premiumRate, rA.add(rC)), B: (0, helper_1.div)(premiumRate, rB), C: (0, helper_1.div)(-premiumRate, rB.add(rC)) };
            }
        }
        return {
            premium,
            riskFactor,
            deleverageRiskA,
            deleverageRiskB,
            dailyInterestRate,
            maxPremiumRate
        };
    }
    getRdc(pools) {
        let rC = (0, helper_1.bn)(0);
        let rDcLong = (0, helper_1.bn)(0);
        let rDcShort = (0, helper_1.bn)(0);
        let supplyDetails = {};
        let rDetails = {};
        for (let pool of pools) {
            rC = pool.states.rC;
            rDcLong = pool.states.rA;
            rDcShort = pool.states.rB;
            rDetails[pool.k.toNumber()] = pool.states.rA;
            rDetails[-pool.k.toNumber()] = pool.states.rB;
            supplyDetails[pool.k.toNumber()] = pool.states.sA;
            supplyDetails[-pool.k.toNumber()] = pool.states.sB;
        }
        return {
            supplyDetails,
            rDetails,
            R: rC.add(rDcLong).add(rDcShort),
            rC,
            rDcLong,
            rDcShort,
        };
    }
    parseDdlLogs(ddlLogs) {
        const eventInterface = new ethers_1.ethers.utils.Interface(this.profile.getAbi('Events'));
        const topics = (0, helper_1.getTopics)();
        return ddlLogs.map((log) => {
            if (!topics.Derivable.includes(log.topics[0]) && !topics.Swap.includes(log.topics[0]) && !topics.Transfer.includes(log.topics[0])) {
                return {};
            }
            try {
                const decodeLog = eventInterface.parseLog(log);
                let appName = '';
                try {
                    appName = ethers_1.ethers.utils.parseBytes32String(decodeLog.args.topic1);
                }
                catch (e) {
                }
                let data = decodeLog;
                if (appName === 'PoolCreated') {
                    const poolCreatedData = utils_1.defaultAbiCoder.decode(this.profile.getEventDataAbi()[appName], decodeLog.args.data);
                    data = Object.assign(Object.assign({}, poolCreatedData), { TOKEN_R: ethers_1.ethers.utils.getAddress('0x' + decodeLog.args.topic3.slice(-40)) });
                }
                return {
                    address: data.poolAddress,
                    contractAddress: log.address,
                    timeStamp: parseInt(log.timeStamp),
                    transactionHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    index: log.logIndex,
                    logIndex: log.transactionHash + '-' + log.logIndex,
                    name: appName,
                    topics: log.topics,
                    args: Object.assign({}, data),
                };
            }
            catch (e) {
                console.error(e);
                return {};
            }
        });
    }
}
exports.Resource = Resource;
//# sourceMappingURL=resource.js.map