"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.History = void 0;
// @ts-nocheck
const ethers_1 = require("ethers");
const helper_1 = require("../utils/helper");
const lodash_1 = __importDefault(require("lodash"));
const powerLib_1 = require("powerLib/dist/powerLib");
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
            const logGrouped = Object.values(lodash_1.default.groupBy(logs, (log) => log.transactionHash))
                .filter((order) => {
                return order.find((log) => ['TransferSingle', 'TransferBatch'].includes(log.args.name));
            });
            const orders = logGrouped.slice().sort((a, b) => a[0].blockNumber - b[0].blockNumber);
            // const swapLogs = logs.slice().sort((a: { timeStamp: number; }, b: { timeStamp: number; }) => a.timeStamp - b.timeStamp)
            const p = new powerLib_1.PowerState({ powers: [...powers] });
            p.loadStates(states);
            //@ts-ignore
            const result = [];
            const balances = {};
            orders.forEach((txs) => {
                var _a;
                const cAmount = (0, helper_1.bn)(0);
                const cp = (0, helper_1.bn)(0);
                const oldBalances = lodash_1.default.cloneDeep(balances);
                const oldLeverage = this.calculateLeverage(p, oldBalances, powers);
                //
                for (const tx of txs) {
                    if (tx.args.name === 'Transfer') {
                        const encodeData = ethers_1.ethers.utils.defaultAbiCoder.encode(["address", "address", "uint256"], tx.args.args);
                        const formatedData = ethers_1.ethers.utils.defaultAbiCoder.decode(["address from", "address to", "uint256 value"], encodeData);
                        const id = (_a = this.CURRENT_POOL.getIdByAddress(tx.address)) === null || _a === void 0 ? void 0 : _a.toNumber();
                        if (!id)
                            continue;
                        if (formatedData.from === this.account) {
                            balances[id] = balances[id] ? balances[id].sub(formatedData.value) : (0, helper_1.bn)(0).sub(formatedData.value);
                        }
                        else if (formatedData.to === this.account) {
                            balances[id] = balances[id] ? balances[id].add(formatedData.value) : (0, helper_1.bn)(0).add(formatedData.value);
                        }
                        continue;
                    }
                    if (tx.args.name === 'TransferSingle') {
                        const encodeData = ethers_1.ethers.utils.defaultAbiCoder.encode(["address", "address", "address", "uint256", "uint256"], tx.args.args);
                        const formatedData = ethers_1.ethers.utils.defaultAbiCoder.decode(["address operator", "address from", "address to", "uint256 id", "uint256 value"], encodeData);
                        const id = formatedData.id.toNumber();
                        if (formatedData.from === this.account) {
                            balances[id] = balances[id] ? balances[id].sub(formatedData.value) : (0, helper_1.bn)(0).sub(formatedData.value);
                        }
                        if (formatedData.to === this.account) {
                            balances[id] = balances[id] ? balances[id].add(formatedData.value) : (0, helper_1.bn)(0).add(formatedData.value);
                        }
                    }
                }
                const newLeverage = this.calculateLeverage(p, balances, powers);
                result.push({
                    transactionHash: txs[0].transactionHash,
                    timeStamp: txs[0].timeStamp,
                    blockNumber: txs[0].blockNumber,
                    cp,
                    oldBalances,
                    newBalances: lodash_1.default.cloneDeep(balances),
                    cAmount,
                    newLeverage,
                    oldLeverage
                });
            });
            //@ts-ignore
            return result.sort((a, b) => (b.blockNumber - a.blockNumber));
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
//# sourceMappingURL=history.disable.js.map