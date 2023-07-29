"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.History = void 0;
const ethers_1 = require("ethers");
const constant_1 = require("../utils/constant");
const helper_1 = require("../utils/helper");
class History {
    constructor(config) {
        this.getSwapAbi = (topic0) => {
            const topics = (0, helper_1.getTopics)();
            if (topic0 === topics.Swap[0]) {
                return constant_1.EventDataAbis.Swap;
            }
            else if (topic0 === topics.Swap[1]) {
                return constant_1.EventDataAbis.Swap1;
            }
            else {
                return constant_1.EventDataAbis.Swap2;
            }
        };
        this.config = config;
        this.account = config.account;
        this.CURRENT_POOL = config.CURRENT_POOL;
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
            return positions;
        }
        catch (e) {
            throw e;
        }
    }
    generatePositionBySwapLog(positions, tokens, formatedData) {
        const pools = this.CURRENT_POOL.pools;
        const poolAddresses = Object.keys(this.CURRENT_POOL.pools);
        const { poolIn, poolOut, sideIn, sideOut, amountOut, amountIn, priceR } = formatedData;
        if (!poolAddresses.includes(poolIn) ||
            !poolAddresses.includes(poolOut)) {
            return;
        }
        const tokenIn = this.getTokenAddressByPoolAndSide(poolIn, formatedData.sideIn);
        const tokenOut = this.getTokenAddressByPoolAndSide(poolOut, formatedData.sideOut);
        if ([constant_1.POOL_IDS.A, constant_1.POOL_IDS.B, constant_1.POOL_IDS.C].includes(sideOut.toNumber())) {
            if (!positions[tokenOut]) {
                positions[tokenOut] = {
                    balance: amountOut,
                    entry: 0
                };
            }
            else {
                positions[tokenOut].balance = positions[tokenOut].balance.add(amountOut);
            }
            if ([constant_1.POOL_IDS.R, constant_1.POOL_IDS.native].includes(sideIn.toNumber()) && priceR) {
                const pool = pools[poolIn];
                const tokenR = tokens.find((t) => t.address === pool.TOKEN_R);
                const tokenRQuote = tokens.find((t) => t.address === this.config.stableCoins[0]);
                const _tokenIn = tokens.find((t) => t.address === tokenIn);
                //@ts-ignore
                const price = (0, helper_1.parseSqrtSpotPrice)(priceR, tokenR, tokenRQuote, 1);
                positions[tokenOut].entry = (0, helper_1.add)(positions[tokenOut].entry, (0, helper_1.weiToNumber)(amountIn.mul((0, helper_1.numberToWei)(price) || 0), 18 + ((_tokenIn === null || _tokenIn === void 0 ? void 0 : _tokenIn.decimal) || 18)));
            }
            else if (positions[tokenIn]) {
                const oldEntry = positions[tokenIn].entry.mul(amountIn).div(positions[tokenIn].balance);
                positions[tokenOut].entry = positions[tokenOut].entry.add(oldEntry);
            }
        }
        if ([constant_1.POOL_IDS.A, constant_1.POOL_IDS.B, constant_1.POOL_IDS.C].includes(sideIn.toNumber())) {
            if (positions[tokenIn]) {
                const oldEntry = positions[tokenIn].entry.mul(amountIn).div(positions[tokenIn].balance);
                positions[tokenIn] = {
                    balance: positions[tokenIn].balance.sub(amountIn),
                    entry: positions[tokenIn].entry.sub(oldEntry),
                };
            }
        }
        return positions;
    }
    formatSwapHistory({ logs }) {
        try {
            if (!logs || logs.length === 0) {
                return [];
            }
            const poolAddresses = Object.keys(this.CURRENT_POOL.pools);
            const swapLogs = logs.map((log) => {
                const abi = this.getSwapAbi(log.topics[0]);
                const encodeData = ethers_1.ethers.utils.defaultAbiCoder.encode(abi, log.args.args);
                const formatedData = ethers_1.ethers.utils.defaultAbiCoder.decode(abi, encodeData);
                const { poolIn, poolOut } = formatedData;
                if (!poolAddresses.includes(poolIn) ||
                    !poolAddresses.includes(poolOut)) {
                    return null;
                }
                const tokenIn = this.getTokenAddressByPoolAndSide(poolIn, formatedData.sideIn);
                const tokenOut = this.getTokenAddressByPoolAndSide(poolOut, formatedData.sideOut);
                return Object.assign({ transactionHash: log.transactionHash, timeStamp: log.timeStamp, blockNumber: log.blockNumber, poolIn,
                    poolOut,
                    tokenIn,
                    tokenOut }, formatedData);
            });
            //@ts-ignore
            return (swapLogs
                .filter((l) => l !== null)
                //@ts-ignore
                .sort((a, b) => b.blockNumber - a.blockNumber));
        }
        catch (e) {
            throw e;
        }
    }
    getTokenAddressByPoolAndSide(poolAddress, side) {
        const pool = this.CURRENT_POOL.pools[poolAddress];
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