"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerState = void 0;
const lodash_1 = __importDefault(require("lodash"));
const helper_1 = require("../utils/helper");
const constant_1 = require("../utils/constant");
const { floor, abs } = Math;
const BN_0 = (0, helper_1.bn)(0);
class PowerState {
    constructor(config) {
        var _a, _b;
        this.k = [2, 5];
        this.unit = 1000000;
        this.basePrice = 0;
        this.TOKEN_R = '';
        this.pools = [];
        this.k = (_a = config === null || config === void 0 ? void 0 : config.powers) !== null && _a !== void 0 ? _a : this.k;
        this.unit = (_b = config === null || config === void 0 ? void 0 : config.unit) !== null && _b !== void 0 ? _b : this.unit;
    }
    loadPools(poolGroup) {
        this.pools = lodash_1.default.clone(poolGroup.pools);
        this.TOKEN_R = lodash_1.default.clone(poolGroup.TOKEN_R);
        this.basePrice = poolGroup.basePrice;
    }
    getPoolByK(k) {
        const pool = Object.values(this.pools).find((p) => p.k.toNumber() === k);
        if (!pool) {
            throw 'Not found pool with k=' + k;
        }
        return pool;
    }
    calculateCompExposure(balances) {
        let totalValue = BN_0;
        let totalExposure = BN_0;
        for (const token of Object.keys(balances)) {
            if ((0, helper_1.isErc1155Address)(token)) {
                const [address, id] = token.split('-');
                if (!this.pools[address])
                    continue;
                let price = '0';
                if (Number(id) === constant_1.POOL_IDS.A) {
                    price = this.calculateLongPriceByK(this.pools[address].k.toNumber());
                }
                if (Number(id) === constant_1.POOL_IDS.B) {
                    price = this.calculateLongPriceByK(this.pools[address].k.toNumber());
                }
                const exposure = this.getExposureByIdAndK(id, this.pools[address].k.toNumber());
                const balance = balances[token];
                totalValue = totalValue.add(balance.mul(floor(this.unit * Number(price))));
                totalExposure = totalExposure.add(balance.mul(floor(this.unit * Number(price) * exposure)));
            }
        }
        if (totalValue.isZero()) {
            return 0;
        }
        return totalExposure.mul(this.unit).div(totalValue).toNumber() / this.unit;
    }
    calculateCompValue(balances) {
        let totalValue = BN_0;
        for (const token of Object.keys(balances)) {
            const [address, id] = token.split('-');
            if (!this.pools[address])
                continue;
            let price = '0';
            if (Number(id) === constant_1.POOL_IDS.A) {
                price = this.calculateLongPriceByK(this.pools[address].k.toNumber());
            }
            if (Number(id) === constant_1.POOL_IDS.B) {
                price = this.calculateLongPriceByK(this.pools[address].k.toNumber());
            }
            const balance = balances[token];
            totalValue = totalValue.add(balance.mul(floor(this.unit * Number(price))));
        }
        return totalValue.div(this.unit);
    }
    getSwapSteps(oldBalances, newExposure, changeAmount, changeToken) {
        var _a, _b, _c, _d;
        oldBalances = lodash_1.default.clone(this.encodeBalances(oldBalances));
        const oldValues = this.valuesFromBalances(oldBalances);
        const oldValue = Object.values(oldValues).reduce((totalValue, value) => totalValue.add(value), BN_0);
        const changePrice = this.getCPrice();
        const changeValue = (_a = changeAmount === null || changeAmount === void 0 ? void 0 : changeAmount.mul(floor(this.unit * changePrice)).div(this.unit)) !== null && _a !== void 0 ? _a : BN_0;
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
        return this.encodeSteps(steps);
    }
    encodeBalances(balances) {
        const result = {};
        for (let token in balances) {
            if ((0, helper_1.isErc1155Address)(token)) {
                const [address, id] = token.split('-');
                if (!this.pools[address])
                    continue;
                const pool = this.pools[address];
                const power = Number(id) === constant_1.POOL_IDS.A
                    ? pool.k.toNumber()
                    : Number(id) === constant_1.POOL_IDS.B
                        ? -pool.k.toNumber()
                        : 0;
                if (pool && power) {
                    result[power] = balances[token];
                }
            }
        }
        return result;
    }
    encodeSteps(steps) {
        return steps.map((step) => {
            return {
                tokenIn: this.convertPowerToAddress(step.tokenIn),
                tokenOut: this.convertPowerToAddress(step.tokenOut),
                amountIn: step.amountIn,
            };
        });
    }
    // power is 2 | 3 | 4 | ... | C
    convertPowerToAddress(power) {
        if (power === 'C') {
            return this.TOKEN_R;
        }
        else if (this.k.includes(Math.abs(Number(power)))) {
            const pool = this.getPoolByK(Math.abs(Number(power)));
            return (pool.poolAddress + '-' + (Number(power) > 0 ? constant_1.POOL_IDS.A : constant_1.POOL_IDS.B));
        }
        return power;
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
    getPowers() {
        const result = [];
        for (let i of this.k) {
            result.push(i, -i);
        }
        return result.sort((a, b) => a - b);
    }
    getPrices() {
        const powers = this.getPowers();
        return powers.map((power) => {
            if (power > 0) {
                return Number(this.calculateLongPriceByK(Math.abs(power)));
            }
            return Number(this.calculateShortPriceByK(Math.abs(power)));
        });
    }
    getCPrice() {
        return 1;
    }
    valuesFromBalances(balances) {
        const result = {};
        for (const power of Object.keys(balances)) {
            let price = this.calculatePrice(Number(power));
            result[power] = balances[power]
                .mul(floor(this.unit * Number(price)))
                .div(this.unit);
        }
        return result;
    }
    // swapAllToC(oldBalance: { [key: number]: BigNumber }): StepType[] {
    //   const steps: StepType[] = []
    //   for (let i in oldBalance) {
    //     steps.push({
    //       tokenIn: i.toString(),
    //       tokenOut: 'C',
    //       amountIn: oldBalance[i],
    //     })
    //   }
    //   return steps
    // }
    getMarks() {
        const ks = this.k;
        const result = {};
        ks.forEach((k) => {
            result[1 + k / 2] = 1 + k / 2;
            result[1 - k / 2] = 1 - k / 2;
        });
        return result;
    }
    getExposures() {
        const ks = this.k;
        const result = [];
        ks.forEach((k) => {
            result.push(1 + k / 2, 1 - k / 2);
        });
        return result;
    }
    getExposureByIdAndK(id, k) {
        if (Number(id) === constant_1.POOL_IDS.A) {
            return 1 + k / 2;
        }
        if (Number(id) === constant_1.POOL_IDS.B) {
            return 1 - k / 2;
        }
        return 0;
    }
    exposureToK(exposure) {
        return exposure > 1 ? (exposure - 1) * 2 : (1 - exposure) * 2;
    }
    calculatePrice(power) {
        if (power > 0) {
            return Number(this.calculateLongPriceByK(Math.abs(power)));
        }
        else {
            return Number(this.calculateShortPriceByK(Math.abs(power)));
        }
    }
    calculateLongPriceByK(k) {
        const pool = this.getPoolByK(k);
        const { rA, sA } = pool.states;
        return (0, helper_1.div)(rA, sA);
    }
    calculateShortPriceByK(k) {
        const pool = this.getPoolByK(k);
        const { rB, sB } = pool.states;
        return (0, helper_1.div)(rB, sB);
    }
}
exports.PowerState = PowerState;
function maxKey(values) {
    let key;
    for (const k of Object.keys(values)) {
        if (key == null || values[k].gt(values[key])) {
            key = k;
        }
    }
    return key;
}
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
exports.default = PowerState;
//# sourceMappingURL=power.js.map