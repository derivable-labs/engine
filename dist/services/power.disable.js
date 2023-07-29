"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodePowers = exports.encodePowers = exports.PowerState = void 0;
const lodash_1 = __importDefault(require("lodash"));
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const helper_1 = require("../utils/helper");
const { floor, abs } = Math;
const BN_0 = (0, helper_1.bn)(0);
class PowerState {
    constructor(config) {
        var _a, _b;
        this.powers = [2, -2, 8, -8];
        this.unit = 1000000;
        this.states = {};
        this.powers = (_a = config === null || config === void 0 ? void 0 : config.powers) !== null && _a !== void 0 ? _a : this.powers;
        this.powersSorted = lodash_1.default.orderBy(this.powers.map(Number), Number);
        this.unit = (_b = config === null || config === void 0 ? void 0 : config.unit) !== null && _b !== void 0 ? _b : this.unit;
    }
    getTokenFromPower(power) {
        for (const token of Object.keys(this.powers)) {
            if (this.powers[token] == power) {
                return Number(token);
            }
        }
        throw new Error('power not found');
    }
    getTokenPower(token) {
        return this.powers[token];
    }
    loadStates(states) {
        this.states = lodash_1.default.clone(states);
    }
    getMarks() {
        const exposures = this.getExposures();
        const result = {};
        exposures.forEach((exposure) => {
            result[exposure] = floor(exposure * 10) / 10;
        });
        return result;
    }
    getPowers() {
        return this.powersSorted;
    }
    getPrices() {
        return this.getPowers().map((power) => this.calculatePrice(power));
    }
    getExposures() {
        return this.getPowers().map((power) => this.calculateExposure(power));
    }
    getPrice(power) {
        if (power == 'C') {
            return this.getCPrice();
        }
        return this.calculatePrice(Number(power));
    }
    calculatePrice(power, states = this.states) {
        const { twapBase, priceScaleLong, priceScaleShort } = states;
        let price = (0, helper_1.bn)(this.unit);
        for (let i = 0; i < abs(power); ++i) {
            price = price.mul(twapBase);
        }
        for (let i = 0; i < abs(power); ++i) {
            price = price.div(power > 0 ? priceScaleLong : priceScaleShort);
        }
        const p = price.toNumber();
        if (power < 0) {
            return this.unit / p;
        }
        return p / this.unit;
    }
    findMinExposure() {
        for (const power of this.powersSorted) {
            const price = this.calculatePrice(power);
            if (price != 0 && Number.isFinite(price)) {
                return this.calculateExposure(power);
            }
        }
        throw new Error('min exposure not found');
    }
    findMaxExposure() {
        for (let i = this.powersSorted.length - 1; i >= 0; --i) {
            const power = this.powersSorted[i];
            const price = this.calculatePrice(power);
            if (price != 0 && Number.isFinite(price)) {
                return this.calculateExposure(power);
            }
        }
        throw new Error('max exposure not found');
    }
    calculateExposure(power) {
        const current = this.calculatePrice(power);
        if (current == 0) {
            return this.findMinExposure();
        }
        if (!Number.isFinite(current)) {
            return this.findMaxExposure();
        }
        const projectedStates = Object.assign(Object.assign({}, this.states), { twapBase: this.states.twapBase.mul(101).div(100) });
        const projection = this.calculatePrice(power, projectedStates);
        return (projection - current) / current / 0.01;
    }
    calculateCompExposure(balances) {
        let totalValue = BN_0;
        let totalExposure = BN_0;
        for (const power of Object.keys(balances)) {
            if (power == 'C')
                continue;
            const balance = balances[power];
            const price = this.calculatePrice(power);
            if (price == 0 || !Number.isFinite(price)) {
                continue;
            }
            const exposure = this.calculateExposure(power);
            totalValue = totalValue.add(balance.mul(floor(this.unit * price)));
            totalExposure = totalExposure.add(balance.mul(floor(this.unit * price * exposure)));
        }
        if (totalValue.isZero()) {
            return 0;
        }
        return totalExposure.mul(this.unit).div(totalValue).toNumber() / this.unit;
    }
    calculateCompValue(balances) {
        let totalValue = BN_0;
        for (const power in balances) {
            const balance = balances[power];
            const price = this.calculatePrice(power);
            totalValue = totalValue.add(balance.mul(floor(this.unit * price)));
        }
        return totalValue.div(this.unit);
    }
    _searchForExposures(es, e, tolerance) {
        es = lodash_1.default.sortBy(es);
        if (e <= es[0]) {
            for (let i = 1; i < es.length; ++i) {
                if (es[i] > es[i - 1]) {
                    return [i - 1];
                }
            }
            return [0];
        }
        if (e > es[es.length - 1]) {
            for (let i = es.length - 1; 0 <= i; --i) {
                if (es[i] < es[i + 1]) {
                    return [i + 1];
                }
            }
            return [es.length - 1];
        }
        const rateTolerance = 1 + tolerance;
        for (let i = 0; i < es.length; ++i) {
            const rate = es[i] / e;
            if (1 / rateTolerance < rate && rate < rateTolerance) {
                return [i];
            }
            if (es[i] > e) {
                return [i - 1, i];
            }
        }
        throw new Error('search for exposure failed');
    }
    // V: target value in quoteToken (BN)
    // E: target exposure (float)
    getOptimalBalances(V, E, tolerance = 0.01) {
        const powers = this.getPowers();
        const ps = this.getPrices();
        const es = this.getExposures();
        const ij = this._searchForExposures(es, E, tolerance);
        if (ij.length === 1) {
            const i = ij[0];
            return {
                [powers[i]]: V.mul(this.unit).mul(floor(this.unit * ps[i])),
            };
        }
        const [i, j] = ij;
        // vj = V*(E-ei)/(ej-ei)
        const vj = V.mul(floor((E - es[i]) * this.unit)).div(floor((es[j] - es[i]) * this.unit));
        // bi = (V-vj)/pi
        const bi = V.mul(this.unit)
            .sub(vj.mul(this.unit))
            .div(floor(ps[i] * this.unit));
        // bj = vj / pj
        const bj = vj.mul(this.unit).div(floor(ps[j] * this.unit));
        return {
            [powers[i]]: bi,
            [powers[j]]: bj,
        };
    }
    valuesFromBalances(balances) {
        return lodash_1.default.transform(balances, (r, v, k) => {
            r[k] = v.mul(floor(this.unit * this.calculatePrice(k))).div(this.unit);
        });
    }
    getBasePrice() {
        return this.states.twapBase.mul(this.unit).shr(128).toNumber() / this.unit;
    }
    getCPrice() {
        return this.states.twapLP.mul(this.unit).shr(128).toNumber() / this.unit;
    }
    getSwapSteps(oldBalances, newExposure, changeAmount, changeToken) {
        var _a, _b, _c, _d;
        if (changeAmount === -1) {
            return this.swapAllToC(oldBalances);
        }
        const oldValues = this.valuesFromBalances(oldBalances);
        const oldValue = Object.values(oldValues).reduce((totalValue, value) => totalValue.add(value), BN_0);
        const changePrice = changeToken == 'Q'
            ? 1
            : changeToken == 'B'
                ? this.getBasePrice()
                : this.getCPrice();
        const changeValue = changeAmount instanceof ethers_1.BigNumber
            ? (_a = changeAmount === null || changeAmount === void 0 ? void 0 : changeAmount.mul(floor(this.unit * changePrice)).div(this.unit)) !== null && _a !== void 0 ? _a : BN_0
            : oldValue
                .mul((0, utils_1.parseEther)((changeAmount || 0).toString()))
                .div((0, utils_1.parseEther)('1'));
        const newValue = oldValue.add(changeValue);
        const newBalances = this.getOptimalBalances(newValue, newExposure);
        const newValues = this.valuesFromBalances(newBalances);
        const changeValues = {};
        for (const power of this.getPowers()) {
            const oldValue = (_b = oldValues[power]) !== null && _b !== void 0 ? _b : BN_0;
            const newValue = (_c = newValues[power]) !== null && _c !== void 0 ? _c : BN_0;
            const change = newValue.sub(oldValue);
            if (!change.isZero() && change.abs().mul(this.unit).gte(oldValue)) {
                changeValues[power] = change;
            }
        }
        let steps = [];
        // there should be atmost 1 step from or to C
        let stepToC;
        if (changeValue && !changeValue.isZero()) {
            if (changeValue.isNegative()) {
                const power = maxKey(lodash_1.default.mapValues(changeValues, (change) => BN_0.sub(change)));
                if (power == null) {
                    console.error('maxKey not found', changeValues);
                    throw new Error('maxKey not found');
                }
                const amountIn = changeValue
                    .mul(-this.unit)
                    .div(floor(this.calculatePrice(power) * this.unit));
                stepToC = {
                    tokenIn: String(power),
                    tokenOut: changeToken !== null && changeToken !== void 0 ? changeToken : 'C',
                    amountIn,
                };
                changeValues[power] = changeValues[power].sub(changeValue);
            }
            else {
                const power = maxKey(changeValues);
                if (power == null) {
                    console.error('maxKey not found', changeValues);
                    throw new Error('maxKey not found');
                }
                steps.push({
                    tokenIn: changeToken !== null && changeToken !== void 0 ? changeToken : 'C',
                    tokenOut: String(power),
                    amountIn: (0, helper_1.bn)(changeAmount),
                });
                changeValues[power] = changeValues[power].sub(changeValue);
            }
        }
        while (Object.keys(changeValues).length > 0) {
            const from = _firstKey(changeValues, true);
            const to = _firstKey(changeValues, false);
            if (to && from == null) {
                const amountIn = changeValues[to]
                    .mul(this.unit)
                    .div(floor(this.unit * this.getCPrice()));
                console.warn(`missing C->${to}`, amountIn.toString());
                delete changeValues[to];
                continue;
            }
            if (from && to == null) {
                if (changeValues[from].abs().mul(this.unit).gte(oldValue)) {
                    const amountIn = changeValues[from]
                        .mul(this.unit)
                        .div(floor(-this.unit * this.calculatePrice(from)));
                    console.warn(`missing ${from}->C`, amountIn.toString());
                }
                delete changeValues[from];
                continue;
            }
            if (from && to) {
                const changeValue = changeValues[from].abs().lte(changeValues[to])
                    ? changeValues[from].abs()
                    : changeValues[to];
                const amountIn = changeValue
                    .mul(this.unit)
                    .div(floor(this.unit * this.calculatePrice(from)));
                steps.push({
                    tokenIn: String(from),
                    tokenOut: String(to),
                    amountIn,
                });
                changeValues[from] = changeValues[from].add(changeValue);
                if (changeValues[from].isZero()) {
                    delete changeValues[from];
                }
                changeValues[to] = changeValues[to].sub(changeValue);
                if (changeValues[to].isZero()) {
                    delete changeValues[to];
                }
            }
        }
        if (stepToC != null) {
            steps.push(stepToC);
        }
        steps = steps.filter((step) => !step.amountIn.isZero());
        // don't leave small balance behind
        const remainBalances = this.getInputBalancesAfterSwap(oldBalances, steps);
        for (const step of steps) {
            const { tokenIn, amountIn } = step;
            const balance = (_d = remainBalances[tokenIn]) !== null && _d !== void 0 ? _d : BN_0;
            if (!balance.isZero() && amountIn.div(balance).gt(this.unit)) {
                step.amountIn = amountIn.add(balance);
                remainBalances[tokenIn] = BN_0;
            }
        }
        return steps;
    }
    swapAllToC(oldBalance) {
        const steps = [];
        for (let i in oldBalance) {
            steps.push({
                tokenIn: i.toString(),
                tokenOut: 'C',
                amountIn: oldBalance[i],
            });
        }
        return steps;
    }
    // does not compute the amount out to returned balances
    getInputBalancesAfterSwap(balances, steps) {
        const newBalances = lodash_1.default.clone(balances);
        for (const step of steps) {
            if (!newBalances[step.tokenIn] || newBalances[step.tokenIn].isZero()) {
                continue;
            }
            newBalances[step.tokenIn] = newBalances[step.tokenIn].sub(step.amountIn);
            if (newBalances[step.tokenIn].isZero()) {
                delete newBalances[step.tokenIn];
            }
        }
        return newBalances;
    }
    swap(balances, steps) {
        var _a, _b;
        const newBalances = lodash_1.default.clone(balances);
        const amountOuts = [];
        for (const step of steps) {
            const { tokenIn, tokenOut, amountIn } = step;
            newBalances[tokenIn] = ((_a = newBalances[tokenIn]) !== null && _a !== void 0 ? _a : BN_0).sub(amountIn);
            if (newBalances[tokenIn].isZero()) {
                delete newBalances[tokenIn];
            }
            const amountOut = amountIn
                .mul(floor((this.unit * this.getPrice(tokenIn)) / this.getPrice(tokenOut)))
                .div(this.unit);
            amountOuts.push(amountOut);
            newBalances[tokenOut] = ((_b = newBalances[tokenOut]) !== null && _b !== void 0 ? _b : BN_0).add(amountOut);
        }
        return {
            amountOuts,
            newBalances,
        };
    }
}
exports.PowerState = PowerState;
function _firstKey(values, negative = false) {
    let m = null;
    Object.entries(values).forEach(([key, value]) => {
        if (negative && value.gte(0))
            return;
        if (!negative && value.lte(0))
            return;
        if (m == null || value.gt(values[m])) {
            // @ts-ignore
            m = key;
        }
    });
    return m;
}
function maxKey(values) {
    let key;
    for (const k of Object.keys(values)) {
        if (key == null || values[k].gt(values[key])) {
            key = k;
        }
    }
    return key;
}
const encodePowers = (powers) => {
    const powersBytes = [];
    for (let i = powers.length - 1; i >= 0; --i) {
        let power = powers[i];
        if (power < 0) {
            power = 0x8000 - power;
        }
        // @ts-ignore
        powersBytes.push(...ethers_1.ethers.utils.zeroPad(power, 2));
    }
    return ethers_1.ethers.utils.hexZeroPad(powersBytes, 32);
};
exports.encodePowers = encodePowers;
const decodePowers = (powersBytes) => {
    powersBytes = ethers_1.ethers.utils.hexStripZeros(powersBytes).slice(2);
    const raws = powersBytes.match(/.{1,4}/g);
    const powers = [];
    for (let i = raws.length - 1; i >= 0; --i) {
        let power = Number('0x' + raws[i]);
        if (power > 0x8000) {
            power = 0x8000 - power;
        }
        powers.push(power);
    }
    return powers;
};
exports.decodePowers = decodePowers;
exports.default = PowerState;
//# sourceMappingURL=power.disable.js.map