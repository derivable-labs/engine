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
var helper_1 = require("../utils/helper");
var lodash_1 = __importDefault(require("lodash"));
var powerLib_1 = require("powerLib/dist/powerLib");
var History = /** @class */ (function () {
    function History() {
    }
    History.prototype.formatSwapHistory = function (_a) {
        var logs = _a.logs, poolAddress = _a.poolAddress, states = _a.states, powers = _a.powers;
        try {
            if (!logs || logs.length === 0 || !poolAddress) {
                return [];
            }
            var swapLogs = logs.slice().sort(function (a, b) { return a.timeStamp - b.timeStamp; });
            var p = new powerLib_1.PowerState({ powers: __spreadArray([], powers, true) });
            p.loadStates(states);
            var result = [];
            var balancesToCalculateLeverage = {};
            var balances = {};
            for (var _i = 0, swapLogs_1 = swapLogs; _i < swapLogs_1.length; _i++) {
                var swapLog = swapLogs_1[_i];
                if (swapLog.args.pool !== poolAddress)
                    continue;
                var steps = swapLog.args.steps;
                var cAmount = (0, helper_1.bn)(0);
                var cp = (0, helper_1.bn)(0);
                var oldBalances = lodash_1["default"].cloneDeep(balances);
                var oldLeverage = p.calculateCompExposure(balancesToCalculateLeverage);
                for (var _b = 0, steps_1 = steps; _b < steps_1.length; _b++) {
                    var step = steps_1[_b];
                    balances[step.idIn.toString()] = balances[step.idIn.toString()] ? balances[step.idIn.toString()].sub(step.amountIn) : (0, helper_1.bn)(0).sub(step.amountIn);
                    balances[step.idOut.toString()] = balances[step.idOut.toString()] ? balances[step.idOut.toString()].add(step.amountOutMin) : (0, helper_1.bn)(0).add(step.amountOutMin);
                    if (powers[step.idIn]) {
                        balancesToCalculateLeverage[powers[step.idIn]] = balancesToCalculateLeverage[powers[step.idIn]] ? balancesToCalculateLeverage[powers[step.idIn]].sub(step.amountIn) : (0, helper_1.bn)(0).sub(step.amountIn);
                    }
                    if (powers[step.idOut]) {
                        balancesToCalculateLeverage[powers[step.idOut]] = balancesToCalculateLeverage[powers[step.idOut]] ? balancesToCalculateLeverage[powers[step.idOut]].add(step.amountOutMin) : (0, helper_1.bn)(0).add(step.amountOutMin);
                    }
                }
                var newLeverage = p.calculateCompExposure(balancesToCalculateLeverage);
                result.push({
                    transactionHash: swapLog.transactionHash,
                    timeStamp: swapLog.timeStamp,
                    cp: cp,
                    oldBalances: oldBalances,
                    newBalances: lodash_1["default"].cloneDeep(balances),
                    cAmount: cAmount,
                    newLeverage: newLeverage,
                    oldLeverage: oldLeverage
                });
            }
            return result.sort(function (a, b) { return (b.timeStamp - a.timeStamp); });
        }
        catch (e) {
            console.error(e);
            return [];
        }
    };
    return History;
}());
exports.History = History;
//# sourceMappingURL=history.js.map