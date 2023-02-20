"use strict";
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
exports.__esModule = true;
exports.History = void 0;
// @ts-nocheck
var ethers_1 = require("ethers");
var helper_1 = require("../utils/helper");
var lodash_1 = __importDefault(require("lodash"));
var powerLib_1 = require("powerLib/dist/powerLib");
var History = /** @class */ (function () {
    function History(configs) {
        this.account = configs.account;
        this.CURRENT_POOL = configs.CURRENT_POOL;
    }
    History.prototype.formatSwapHistory = function (_a) {
        var _this = this;
        var logs = _a.logs, poolAddress = _a.poolAddress, states = _a.states, powers = _a.powers;
        try {
            if (!logs || logs.length === 0 || !poolAddress) {
                return [];
            }
            var logGrouped = Object.values(lodash_1["default"].groupBy(logs, function (log) { return log.transactionHash; }))
                .filter(function (order) {
                return order.find(function (log) { return ['TransferSingle', 'TransferBatch'].includes(log.args.name); });
            });
            var orders = logGrouped.slice().sort(function (a, b) { return a[0].blockNumber - b[0].blockNumber; });
            // const swapLogs = logs.slice().sort((a: { timeStamp: number; }, b: { timeStamp: number; }) => a.timeStamp - b.timeStamp)
            var p_1 = new powerLib_1.PowerState({ powers: __spreadArray([], powers, true) });
            p_1.loadStates(states);
            //@ts-ignore
            var result_1 = [];
            var balances_1 = {};
            orders.forEach(function (txs) {
                var _a;
                var cAmount = (0, helper_1.bn)(0);
                var cp = (0, helper_1.bn)(0);
                var oldBalances = lodash_1["default"].cloneDeep(balances_1);
                var oldLeverage = _this.calculateLeverage(p_1, oldBalances, powers);
                //
                for (var _i = 0, txs_1 = txs; _i < txs_1.length; _i++) {
                    var tx = txs_1[_i];
                    if (tx.args.name === 'Transfer') {
                        var encodeData = ethers_1.ethers.utils.defaultAbiCoder.encode(["address", "address", "uint256"], tx.args.args);
                        var formatedData = ethers_1.ethers.utils.defaultAbiCoder.decode(["address from", "address to", "uint256 value"], encodeData);
                        var id = (_a = _this.CURRENT_POOL.getIdByAddress(tx.address)) === null || _a === void 0 ? void 0 : _a.toNumber();
                        if (!id)
                            continue;
                        if (formatedData.from === _this.account) {
                            balances_1[id] = balances_1[id] ? balances_1[id].sub(formatedData.value) : (0, helper_1.bn)(0).sub(formatedData.value);
                        }
                        else if (formatedData.to === _this.account) {
                            balances_1[id] = balances_1[id] ? balances_1[id].add(formatedData.value) : (0, helper_1.bn)(0).add(formatedData.value);
                        }
                        continue;
                    }
                    if (tx.args.name === 'TransferSingle') {
                        var encodeData = ethers_1.ethers.utils.defaultAbiCoder.encode(["address", "address", "address", "uint256", "uint256"], tx.args.args);
                        var formatedData = ethers_1.ethers.utils.defaultAbiCoder.decode(["address operator", "address from", "address to", "uint256 id", "uint256 value"], encodeData);
                        var id = formatedData.id.toNumber();
                        if (formatedData.from === _this.account) {
                            balances_1[id] = balances_1[id] ? balances_1[id].sub(formatedData.value) : (0, helper_1.bn)(0).sub(formatedData.value);
                        }
                        if (formatedData.to === _this.account) {
                            balances_1[id] = balances_1[id] ? balances_1[id].add(formatedData.value) : (0, helper_1.bn)(0).add(formatedData.value);
                        }
                    }
                }
                var newLeverage = _this.calculateLeverage(p_1, balances_1, powers);
                result_1.push({
                    transactionHash: txs[0].transactionHash,
                    timeStamp: txs[0].timeStamp,
                    blockNumber: txs[0].blockNumber,
                    cp: cp,
                    oldBalances: oldBalances,
                    newBalances: lodash_1["default"].cloneDeep(balances_1),
                    cAmount: cAmount,
                    newLeverage: newLeverage,
                    oldLeverage: oldLeverage
                });
            });
            //@ts-ignore
            return result_1.sort(function (a, b) { return (b.blockNumber - a.blockNumber); });
        }
        catch (e) {
            console.error(e);
            return [];
        }
    };
    History.prototype.calculateLeverage = function (powerState, balances, powers) {
        var _balances = {};
        for (var i in balances) {
            if (powers[i]) {
                _balances[powers[i]] = balances[i];
            }
        }
        return powerState.calculateCompExposure(_balances);
    };
    return History;
}());
exports.History = History;
//# sourceMappingURL=history.js.map