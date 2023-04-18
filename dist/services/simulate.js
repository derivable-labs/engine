"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Simulate = void 0;
const helper_1 = require("../utils/helper");
const number_1 = require("../utils/number");
const SYNC_EVENT_TOPIC = '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1';
const POOL_ID = {
    R: 0x00,
    A: 0x10,
    B: 0x20,
    C: 0x30,
};
const unit = 100000;
class Simulate {
    constructor(configs) {
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.provider = configs.provider;
        this.providerToGetLog = configs.providerToGetLog;
        this.UNIV2PAIR = configs.UNIV2PAIR;
        this.pool = {
            mark: (0, helper_1.bn)('7788445287819172527008699396495269118'),
            k: 2,
            states: {
                twap: (0, helper_1.bn)('6788445287819172527008699396495269118'),
                spot: (0, helper_1.bn)('6788445287819172527008699396495269118'),
                R: (0, helper_1.bn)((0, helper_1.numberToWei)(10)),
                a: (0, helper_1.bn)((0, helper_1.numberToWei)(1)),
                b: (0, helper_1.bn)((0, helper_1.numberToWei)(1)),
                sA: (0, helper_1.bn)((0, helper_1.numberToWei)(10)),
                sB: (0, helper_1.bn)((0, helper_1.numberToWei)(10)),
                sC: (0, helper_1.bn)((0, helper_1.numberToWei)(10))
            }
        };
    }
    getAmountOut(sideIn, amountIn, sideOut) {
        const { twap, spot } = this.pool.states;
        const exactInWithTwap = this.exactIn(twap, sideIn, amountIn, sideOut);
        const exactInWithSpot = this.exactIn(spot, sideIn, amountIn, sideOut);
        return exactInWithTwap.lt(exactInWithSpot) ? exactInWithTwap : exactInWithSpot;
    }
    exactIn(price, sideIn, amountIn, sideOut) {
        const { R, a, b, sA, sB, sC } = this.pool.states;
        // calculate reserve after swap (unit = base token (WETH))
        let R1 = this.pool.states.R.add(amountIn);
        if (sideIn === POOL_ID.R) {
            R1 = this.pool.states.R.add(amountIn);
        }
        if (sideIn === POOL_ID.A) {
            R1 = this.pool.states.R.add(this.getReserveIn({ amountIn, rV: a, sV: sA }));
        }
        if (sideIn === POOL_ID.B) {
            R1 = this.pool.states.R.add(this.getReserveIn({ amountIn, rV: b, sV: sB }));
        }
        if (sideIn === POOL_ID.C) {
            R1 = this.pool.states.R.add(this.getReserveIn({ amountIn, rV: R.sub(a).sub(b), sV: sC }));
        }
        // ==================
        let amountOut = (0, helper_1.bn)(0);
        if (sideOut === POOL_ID.R) {
            amountOut = R1.sub(R);
        }
        if (sideOut === POOL_ID.A) {
            amountOut = this.dsv({ price, R1, rV: a, sV: sA });
        }
        if (sideOut === POOL_ID.B) {
            amountOut = this.dsv({ price, R1, rV: b, sV: sB });
        }
        if (sideOut === POOL_ID.C) {
            amountOut = this.dsv({ price, R1, rV: R.sub(b).sub(a), sV: sC });
        }
        return amountOut;
    }
    getReserveIn({ amountIn, rV, sV }) {
        // dsV = amountIn, rIn = drV = dsV * rV / sV
        return amountIn.mul(rV).sub(sV);
    }
    dsv({ price, R1, rV, sV }) {
        const { mark, k } = this.pool;
        const xk = (mark.pow(k)).mul(unit).div(price.pow(k)).toNumber() / unit;
        const rV1 = this._r((0, number_1.floatToFixed112)(xk), rV, R1);
        const drV = rV1.sub(rV);
        return drV.mul(sV).sub(rV);
    }
    _r(xk, v, R) {
        let r = v.mul(xk).div(number_1.FixedPoint.Q112);
        if (r.lt(R.div(2))) {
            const denominator = v.mul(xk.div(4)).div(number_1.FixedPoint.Q112);
            const minuend = R.mul(R).div(denominator);
            r = R.sub(minuend);
        }
        return r;
    }
    evaluate(sideIn, amount) {
        return this.getAmountOut(sideIn, amount, POOL_ID.R);
    }
}
exports.Simulate = Simulate;
//# sourceMappingURL=simulate.js.map