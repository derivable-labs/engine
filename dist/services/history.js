"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.History = void 0;
const ethers_1 = require("ethers");
const constant_1 = require("../utils/constant");
class History {
    constructor(config) {
        this.account = config.account;
        this.CURRENT_POOL = config.CURRENT_POOL;
    }
    formatSwapHistory({ logs }) {
        try {
            if (!logs || logs.length === 0) {
                return [];
            }
            const poolAddresses = Object.keys(this.CURRENT_POOL.pools);
            const swapLogs = logs.map((log, index) => {
                console.log(index);
                const encodeData = ethers_1.ethers.utils.defaultAbiCoder.encode(constant_1.EventDataAbis.Swap, log.args.args);
                const formatedData = ethers_1.ethers.utils.defaultAbiCoder.decode(constant_1.EventDataAbis.Swap, encodeData);
                const { poolIn, poolOut } = formatedData;
                if (!poolAddresses.includes(poolIn) || !poolAddresses.includes(poolOut)) {
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
            return swapLogs
                .filter((l) => l !== null)
                //@ts-ignore
                .sort((a, b) => b.blockNumber - a.blockNumber);
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