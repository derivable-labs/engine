"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.History = void 0;
const helper_1 = require("../utils/helper");
const constant_1 = require("../utils/constant");
class History {
    constructor(configs) {
        this.account = configs.account;
        this.CURRENT_POOL = configs.CURRENT_POOL;
    }
    formatSwapHistory({ logs, poolAddress, states, powers }) {
        try {
            if (!logs || logs.length === 0 || !poolAddress) {
                return [];
            }
            const swapLogs = logs.map((log) => {
                const formatedData = {
                    sideIn: (0, helper_1.bn)(log.args.sideIn.hex),
                    sideOut: (0, helper_1.bn)(log.args.sideOut.hex),
                    amountIn: (0, helper_1.bn)(log.args.amountIn.hex),
                    amountOut: (0, helper_1.bn)(log.args.amountOut.hex),
                    payer: log.args.payer,
                    recipient: log.args.recipient
                };
                const poolIn = log.topics[2].slice(0, 42);
                const poolOut = log.topics[3].slice(0, 42);
                const tokenIn = formatedData.sideIn.eq(constant_1.POOL_IDS.native)
                    ? constant_1.NATIVE_ADDRESS
                    : poolIn + '-' + formatedData.sideIn.toString();
                const tokenOut = formatedData.sideOut.eq(constant_1.POOL_IDS.native)
                    ? constant_1.NATIVE_ADDRESS
                    : poolIn + '-' + formatedData.sideOut.toString();
                return Object.assign({ transactionHash: log.transactionHash, timeStamp: log.timeStamp, poolIn,
                    poolOut,
                    tokenIn,
                    tokenOut }, formatedData);
            });
            //@ts-ignore
            return swapLogs.sort((a, b) => (b.blockNumber - a.blockNumber));
        }
        catch (e) {
            throw e;
        }
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