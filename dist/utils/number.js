"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixed112ToFloat = exports.floatToFixed112 = exports.FixedPoint = void 0;
const ethers_1 = require("ethers");
const helper_1 = require("./helper");
exports.FixedPoint = {
    Q112: (0, helper_1.bn)('0x10000000000000000000000000000') // 2**112
};
const packId = (kind, address) => {
    const k = (0, helper_1.bn)(kind);
    return k.shl(160).add(address);
};
const unpackId = (id) => {
    const k = ethers_1.ethers.utils.hexlify(id.shr(160));
    const p = ethers_1.ethers.utils.getAddress(ethers_1.ethers.utils.hexlify(id.mod((0, helper_1.bn)(1).shl(160))));
    return { k, p };
};
function encodeSqrtX96(reserve1, reserve0) {
    return (0, helper_1.bn)((Math.sqrt(reserve1 / reserve0) * Math.pow(10, 12)).toFixed(0))
        .mul((0, helper_1.bn)(2).pow(96))
        .div(Math.pow(10, 12));
}
const FLOAT_UNIT = 100000;
const floatToFixed112 = (n) => {
    return (0, helper_1.bn)(n * FLOAT_UNIT).shl(112).div(FLOAT_UNIT);
};
exports.floatToFixed112 = floatToFixed112;
const fixed112ToFloat = (fixed112) => {
    return (0, helper_1.bn)(fixed112).mul(FLOAT_UNIT).shr(112).toNumber() / FLOAT_UNIT;
};
exports.fixed112ToFloat = fixed112ToFloat;
//# sourceMappingURL=number.js.map