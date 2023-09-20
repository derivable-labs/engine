"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.History = void 0;
const ethers_1 = require("ethers");
const constant_1 = require("../utils/constant");
const helper_1 = require("../utils/helper");
class History {
    constructor(config, profile) {
        this.getSwapAbi = (topic0) => {
            const topics = (0, helper_1.getTopics)();
            if (topic0 === topics.Swap[0]) {
                return this.profile.getEventDataAbi().Swap;
            }
            else if (topic0 === topics.Swap[1]) {
                return this.profile.getEventDataAbi().Swap1;
            }
            else {
                return this.profile.getEventDataAbi().Swap2;
            }
        };
        this.config = config;
        this.account = config.account;
        this.CURRENT_POOL = config.CURRENT_POOL;
        this.RESOURCE = config.RESOURCE;
        this.profile = profile;
    }
    generatePositions({ tokens, logs }) {
        try {
            if (!logs || logs.length === 0) {
                return [];
            }
            let positions = {};
            logs = logs.sort((a, b) => a.blockNumber - b.blockNumber);
            logs.forEach((log) => {
                const abi = this.getSwapAbi(log.topics[0]);
                const encodeData = ethers_1.ethers.utils.defaultAbiCoder.encode(abi, log.args.args);
                const formatedData = ethers_1.ethers.utils.defaultAbiCoder.decode(abi, encodeData);
                positions = this.generatePositionBySwapLog(positions, tokens, formatedData);
            });
            for (let i in positions) {
                positions[i].entryPrice = positions[i].value && positions[i].balanceToCalculatePrice && positions[i].balanceToCalculatePrice.gt(0) ? (0, helper_1.div)(positions[i].value, positions[i].balanceToCalculatePrice) : 0;
            }
            return positions;
        }
        catch (e) {
            throw e;
        }
    }
    generatePositionBySwapLog(positions, tokens, formatedData) {
        var _a;
        const pools = this.RESOURCE.pools;
        const poolAddresses = Object.keys(this.RESOURCE.pools);
        const { poolIn, poolOut, sideIn, sideOut, amountOut, amountIn, priceR, price } = formatedData;
        if (!poolAddresses.includes(poolIn) ||
            !poolAddresses.includes(poolOut)) {
            return positions;
        }
        const tokenInAddress = this.getTokenAddressByPoolAndSide(poolIn, formatedData.sideIn);
        const tokenOutAddress = this.getTokenAddressByPoolAndSide(poolOut, formatedData.sideOut);
        const tokenIn = tokens.find((t) => t.address === tokenInAddress);
        const tokenOut = tokens.find((t) => t.address === tokenOutAddress);
        if ([constant_1.POOL_IDS.A, constant_1.POOL_IDS.B, constant_1.POOL_IDS.C].includes(sideOut.toNumber())) {
            if (!positions[tokenOutAddress]) {
                positions[tokenOutAddress] = {
                    balance: (0, helper_1.bn)(0),
                    balanceToCalculatePrice: (0, helper_1.bn)(0),
                    value: 0,
                    entry: 0,
                    totalEntryR: 0, // totalEntryR
                };
            }
            if (priceR) {
                positions[tokenOutAddress].balance = positions[tokenOutAddress].balance.add(amountOut);
            }
            if ([constant_1.POOL_IDS.R, constant_1.POOL_IDS.native].includes(sideIn.toNumber()) && priceR) {
                const pool = pools[poolIn];
                const tokenR = tokens.find((t) => t.address === pool.TOKEN_R);
                const tokenRQuote = tokens.find((t) => t.address === this.profile.configs.stablecoins[0]);
                //@ts-ignore
                const priceRFormated = (0, helper_1.parseSqrtSpotPrice)(priceR, tokenR, tokenRQuote, 1);
                positions[tokenOutAddress].totalEntryR = (0, helper_1.add)((_a = positions[tokenOutAddress].totalEntryR) !== null && _a !== void 0 ? _a : 0, amountIn);
                positions[tokenOutAddress].entry = (0, helper_1.add)(positions[tokenOutAddress].entry, (0, helper_1.weiToNumber)(amountIn.mul((0, helper_1.numberToWei)(priceRFormated) || 0), 18 + ((tokenIn === null || tokenIn === void 0 ? void 0 : tokenIn.decimal) || 18)));
            }
            if (price) {
                //@ts-ignore
                const indexPrice = (0, helper_1.parseSqrtSpotPrice)(price, tokens.find((t) => (t === null || t === void 0 ? void 0 : t.address) === this.CURRENT_POOL.baseToken), tokens.find((t) => (t === null || t === void 0 ? void 0 : t.address) === this.CURRENT_POOL.quoteToken), 1);
                positions[tokenOutAddress].value = (0, helper_1.add)(positions[tokenOutAddress].value, (0, helper_1.mul)(amountOut, indexPrice));
                positions[tokenOutAddress].balanceToCalculatePrice = positions[tokenOutAddress].balanceToCalculatePrice.add(amountOut);
            }
        }
        if ([constant_1.POOL_IDS.A, constant_1.POOL_IDS.B, constant_1.POOL_IDS.C].includes(sideIn.toNumber())) {
            if (positions[tokenInAddress] && positions[tokenInAddress].entry) {
                const oldEntry = (0, helper_1.div)((0, helper_1.mul)(positions[tokenInAddress].entry, amountIn), positions[tokenInAddress].balance);
                const oldEntryR = (0, helper_1.div)((0, helper_1.mul)(positions[tokenInAddress].totalEntryR, amountIn), positions[tokenInAddress].balance);
                const oldValue = (0, helper_1.div)((0, helper_1.mul)(positions[tokenInAddress].value, amountIn), positions[tokenInAddress].balance);
                positions[tokenInAddress] = {
                    balance: (0, helper_1.max)(positions[tokenInAddress].balance.sub(amountIn), (0, helper_1.bn)(0)),
                    entry: (0, helper_1.max)((0, helper_1.sub)(positions[tokenInAddress].entry, oldEntry), 0),
                    totalEntryR: (0, helper_1.max)((0, helper_1.sub)(positions[tokenInAddress].totalEntryR, oldEntryR), 0),
                    value: (0, helper_1.max)((0, helper_1.sub)(positions[tokenInAddress].value, oldValue), 0),
                    balanceToCalculatePrice: (0, helper_1.max)(positions[tokenInAddress].balanceToCalculatePrice.sub(amountIn), (0, helper_1.bn)(0))
                };
            }
        }
        return positions;
    }
    formatSwapHistory({ logs, tokens }) {
        try {
            if (!logs || logs.length === 0) {
                return [];
            }
            const pools = this.CURRENT_POOL.pools;
            const poolAddresses = Object.keys(this.CURRENT_POOL.pools);
            const swapLogs = logs.map((log) => {
                const abi = this.getSwapAbi(log.topics[0]);
                const encodeData = ethers_1.ethers.utils.defaultAbiCoder.encode(abi, log.args.args);
                const formatedData = ethers_1.ethers.utils.defaultAbiCoder.decode(abi, encodeData);
                const { poolIn, poolOut, sideIn, sideOut, amountIn, amountOut, price, priceR } = formatedData;
                if (!poolAddresses.includes(poolIn) ||
                    !poolAddresses.includes(poolOut)) {
                    return null;
                }
                const tokenInAddress = this.getTokenAddressByPoolAndSide(poolIn, formatedData.sideIn);
                const tokenOutAddress = this.getTokenAddressByPoolAndSide(poolOut, formatedData.sideOut);
                const tokenIn = tokens.find((t) => t.address === tokenInAddress);
                const tokenOut = tokens.find((t) => t.address === tokenOutAddress);
                let entryValue;
                let entryPrice;
                if (([constant_1.POOL_IDS.R, constant_1.POOL_IDS.native].includes(sideIn.toNumber()) || [constant_1.POOL_IDS.R, constant_1.POOL_IDS.native].includes(sideOut.toNumber())) && priceR) {
                    const pool = [constant_1.POOL_IDS.R, constant_1.POOL_IDS.native].includes(sideIn.toNumber()) ? pools[poolIn] : pools[poolOut];
                    const amount = [constant_1.POOL_IDS.R, constant_1.POOL_IDS.native].includes(sideIn.toNumber()) ? amountIn : amountOut;
                    const tokenR = tokens.find((t) => t.address === pool.TOKEN_R);
                    const tokenRQuote = tokens.find((t) => t.address === this.profile.configs.stablecoins[0]);
                    //@ts-ignore
                    const priceRFormated = (0, helper_1.parseSqrtSpotPrice)(priceR, tokenR, tokenRQuote, 1);
                    entryValue = (0, helper_1.weiToNumber)(amount.mul((0, helper_1.numberToWei)(priceRFormated) || 0), 18 + ((tokenIn === null || tokenIn === void 0 ? void 0 : tokenIn.decimal) || 18));
                }
                if (price) {
                    //@ts-ignore
                    entryPrice = (0, helper_1.parseSqrtSpotPrice)(price, this.CURRENT_POOL.pair.token0, this.CURRENT_POOL.pair.token1, this.CURRENT_POOL.pair.quoteTokenIndex);
                }
                return Object.assign({ transactionHash: log.transactionHash, timeStamp: log.timeStamp, blockNumber: log.blockNumber, logIndex: log.logIndex, poolIn,
                    poolOut, tokenIn: tokenInAddress, tokenOut: tokenOutAddress, entryValue,
                    entryPrice }, formatedData);
            });
            return (swapLogs
                .filter((l) => l !== null)
                .sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex));
        }
        catch (e) {
            throw e;
        }
    }
    getTokenAddressByPoolAndSide(poolAddress, side) {
        const pool = this.RESOURCE.pools[poolAddress];
        if (side.eq(constant_1.POOL_IDS.native)) {
            return constant_1.NATIVE_ADDRESS;
        }
        if (side.eq(constant_1.POOL_IDS.R)) {
            return (pool === null || pool === void 0 ? void 0 : pool.TOKEN_R) || constant_1.NATIVE_ADDRESS;
        }
        return poolAddress + '-' + side.toString();
    }
    calculateLeverage(powerState, balances, powers) {
        const _balances = {};
        for (let i in balances) {
            if (powers[i]) {
                _balances[powers[i]] = balances[i];
            }
        }
        return powerState.calculateCompExposure(_balances);
    }
}
exports.History = History;
//# sourceMappingURL=history.js.map