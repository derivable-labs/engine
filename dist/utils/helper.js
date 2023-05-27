"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDeep = exports.parseSqrtSpotPrice = exports.parseUq128x128 = exports.packId = exports.detectDecimalFromPrice = exports.add = exports.div = exports.sub = exports.mul = exports.formatPercent = exports.formatFloat = exports.getNormalAddress = exports.isErc1155Address = exports.getErc1155Token = exports.getLogicAbi = exports.formatMultiCallBignumber = exports.decodePowers = exports.numberToWei = exports.weiToNumber = exports.bn = exports.provider = void 0;
const ethers_1 = require("ethers");
const Logic_json_1 = __importDefault(require("../abi/56/Logic.json"));
const Logic_json_2 = __importDefault(require("../abi/97/Logic.json"));
const Logic_json_3 = __importDefault(require("../abi/31337/Logic.json"));
const Logic_json_4 = __importDefault(require("../abi/31337/Logic.json"));
const LogicAbi = {
    56: Logic_json_1.default,
    97: Logic_json_2.default,
    31337: Logic_json_3.default,
    42161: Logic_json_4.default,
};
exports.provider = new ethers_1.ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
exports.bn = ethers_1.BigNumber.from;
const weiToNumber = (wei, decimal = 18) => {
    if (!wei || !Number(wei))
        return '0';
    wei = wei.toString();
    return ethers_1.utils.formatUnits(wei, decimal);
};
exports.weiToNumber = weiToNumber;
const numberToWei = (number, decimal = 18) => {
    number = number.toString();
    const arr = number.split('.');
    if (arr[1] && arr[1].length > decimal) {
        arr[1] = arr[1].slice(0, decimal);
        number = arr.join('.');
    }
    return ethers_1.utils.parseUnits(number, decimal).toString();
};
exports.numberToWei = numberToWei;
const decodePowers = (powersBytes) => {
    powersBytes = powersBytes.slice(6);
    const raws = powersBytes.match(/.{1,4}/g);
    const powers = [];
    for (let i = raws.length - 1; i >= 0; --i) {
        let power = Number('0x' + raws[i]);
        if (power > 0x8000) {
            power = 0x8000 - power;
        }
        if (power !== 0) {
            powers.push(power);
        }
    }
    return powers;
};
exports.decodePowers = decodePowers;
const formatMultiCallBignumber = (data) => {
    return data.map((item) => {
        if (item.type === 'BigNumber') {
            item = (0, exports.bn)(item.hex);
        }
        if (Array.isArray(item)) {
            item = (0, exports.formatMultiCallBignumber)(item);
        }
        return item;
    });
};
exports.formatMultiCallBignumber = formatMultiCallBignumber;
const getLogicAbi = (chainId) => {
    return LogicAbi[chainId];
};
exports.getLogicAbi = getLogicAbi;
const getErc1155Token = (addresses) => {
    const erc1155Addresses = addresses.filter(exports.isErc1155Address);
    const result = {};
    for (let i = 0; i < erc1155Addresses.length; i++) {
        const address = erc1155Addresses[i].split('-')[0];
        const id = erc1155Addresses[i].split('-')[1];
        if (!result[address]) {
            result[address] = [(0, exports.bn)(id)];
        }
        else {
            result[address].push((0, exports.bn)(id));
        }
    }
    return result;
};
exports.getErc1155Token = getErc1155Token;
/**
 * format of erc1155 = 0xabc...abc-id
 * @param address
 */
const isErc1155Address = (address) => {
    return /^0x[0-9,a-f,A-Z]{40}-[0-9]{1,}$/g.test(address);
};
exports.isErc1155Address = isErc1155Address;
const getNormalAddress = (addresses) => {
    return addresses.filter((adr) => /^0x[0-9,a-f,A-Z]{40}$/g.test(adr));
};
exports.getNormalAddress = getNormalAddress;
const formatFloat = (number, decimal = 4) => {
    number = number.toString();
    const arr = number.split('.');
    if (arr.length > 1) {
        arr[1] = arr[1].slice(0, decimal);
    }
    return arr.join('.');
};
exports.formatFloat = formatFloat;
const formatPercent = (floatNumber, decimal = 2) => {
    floatNumber = floatNumber.toString();
    return (0, exports.formatFloat)((0, exports.weiToNumber)((0, exports.numberToWei)(floatNumber), 16), decimal);
};
exports.formatPercent = formatPercent;
const mul = (a, b) => {
    var _a;
    const result = (0, exports.weiToNumber)(ethers_1.BigNumber.from((0, exports.numberToWei)(a)).mul((0, exports.numberToWei)(b)), 36);
    const arr = result.split('.');
    arr[1] = (_a = arr[1]) === null || _a === void 0 ? void 0 : _a.slice(0, 18);
    return arr[1] ? arr.join('.') : arr.join('');
};
exports.mul = mul;
const sub = (a, b) => {
    return (0, exports.weiToNumber)(ethers_1.BigNumber.from((0, exports.numberToWei)(a)).sub((0, exports.numberToWei)(b)));
};
exports.sub = sub;
const div = (a, b) => {
    if (!b || b.toString() === '0') {
        return '0';
    }
    return (0, exports.weiToNumber)(ethers_1.BigNumber.from((0, exports.numberToWei)(a, 36)).div((0, exports.numberToWei)(b)));
};
exports.div = div;
const add = (a, b) => {
    return (0, exports.weiToNumber)(ethers_1.BigNumber.from((0, exports.numberToWei)(a)).add((0, exports.numberToWei)(b)));
};
exports.add = add;
const detectDecimalFromPrice = (price) => {
    if (Number(price || 0) === 0 || Number(price || 0) >= 1) {
        return 4;
    }
    else {
        const rate = !(0, exports.bn)((0, exports.numberToWei)(price)).isZero()
            ? (0, exports.weiToNumber)(ethers_1.BigNumber.from((0, exports.numberToWei)(1, 36)).div((0, exports.numberToWei)(price)).toString())
            : '0';
        return rate.split('.')[0].length + 3;
    }
};
exports.detectDecimalFromPrice = detectDecimalFromPrice;
const packId = (kind, address) => {
    const k = (0, exports.bn)(kind);
    return k.shl(160).add(address);
};
exports.packId = packId;
const parseUq128x128 = (value, unit = 1000) => {
    return value.mul(unit).shr(112).toNumber() / unit;
};
exports.parseUq128x128 = parseUq128x128;
const parseSqrtSpotPrice = (value, token0, token1, quoteTokenIndex) => {
    let price = (0, exports.weiToNumber)(value.mul(value).mul((0, exports.numberToWei)(1, token0.decimal)).shr(256), token1.decimal);
    if (quoteTokenIndex === 0) {
        price = (0, exports.weiToNumber)((0, exports.bn)((0, exports.numberToWei)(1, 36)).div((0, exports.bn)((0, exports.numberToWei)(price))));
    }
    return (0, exports.formatFloat)(price, 18);
};
exports.parseSqrtSpotPrice = parseSqrtSpotPrice;
const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item);
};
const mergeDeep = (target, ...sources) => {
    if (!sources.length)
        return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key])
                    Object.assign(target, { [key]: {} });
                (0, exports.mergeDeep)(target[key], source[key]);
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return (0, exports.mergeDeep)(target, ...sources);
};
exports.mergeDeep = mergeDeep;
//# sourceMappingURL=helper.js.map