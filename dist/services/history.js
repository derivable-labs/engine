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
    formatSwapHistory({ logs, }) {
        try {
            if (!logs || logs.length === 0) {
                return [];
            }
            const swapLogs = logs.map((log) => {
                var _a, _b, _c, _d;
                const formatedData = {
                    sideIn: ((_a = log.args.sideIn) === null || _a === void 0 ? void 0 : _a.hex) ? (0, helper_1.bn)(log.args.sideIn.hex) : (0, helper_1.bn)(log.args.sideIn),
                    sideOut: ((_b = log.args.sideOut) === null || _b === void 0 ? void 0 : _b.hex) ? (0, helper_1.bn)(log.args.sideOut.hex) : (0, helper_1.bn)(log.args.sideOut),
                    amountIn: ((_c = log.args.amountIn) === null || _c === void 0 ? void 0 : _c.hex) ? (0, helper_1.bn)(log.args.amountIn.hex) : (0, helper_1.bn)(log.args.amountIn),
                    amountOut: ((_d = log.args.amountOut) === null || _d === void 0 ? void 0 : _d.hex) ? (0, helper_1.bn)(log.args.amountOut.hex) : (0, helper_1.bn)(log.args.amountOut),
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