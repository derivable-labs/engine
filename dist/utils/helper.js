"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.detectDecimalFromPrice = exports.add = exports.div = exports.sub = exports.mul = exports.formatPercent = exports.formatFloat = exports.getNormalAddress = exports.isErc1155Address = exports.getErc1155Token = exports.getLogicAbi = exports.formatMultiCallBignumber = exports.decodePowers = exports.numberToWei = exports.weiToNumber = exports.bn = exports.provider = void 0;
var ethers_1 = require("ethers");
var Logic_json_1 = __importDefault(require("../abi/56/Logic.json"));
var Logic_json_2 = __importDefault(require("../abi/97/Logic.json"));
var Logic_json_3 = __importDefault(require("../abi/31337/Logic.json"));
var Logic_json_4 = __importDefault(require("../abi/31337/Logic.json"));
var LogicAbi = {
    56: Logic_json_1["default"],
    97: Logic_json_2["default"],
    31337: Logic_json_3["default"],
    42161: Logic_json_4["default"]
};
exports.provider = new ethers_1.ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
exports.bn = ethers_1.BigNumber.from;
var weiToNumber = function (wei, decimal) {
    if (decimal === void 0) { decimal = 18; }
    if (!wei || !Number(wei))
        return '0';
    wei = wei.toString();
    return ethers_1.utils.formatUnits(wei, decimal);
};
exports.weiToNumber = weiToNumber;
var numberToWei = function (number, decimal) {
    if (decimal === void 0) { decimal = 18; }
    number = number.toString();
    var arr = number.split('.');
    if (arr[1] && arr[1].length > decimal) {
        arr[1] = arr[1].slice(0, decimal);
        number = arr.join('.');
    }
    return ethers_1.utils.parseUnits(number, decimal).toString();
};
exports.numberToWei = numberToWei;
var decodePowers = function (powersBytes) {
    powersBytes = ethers_1.ethers.utils.hexStripZeros(powersBytes).slice(2);
    var raws = powersBytes.match(/.{1,4}/g);
    var powers = [];
    for (var i = raws.length - 1; i >= 0; --i) {
        var power = Number('0x' + raws[i]);
        if (power > 0x8000) {
            power = 0x8000 - power;
        }
        powers.push(power);
    }
    return powers;
};
exports.decodePowers = decodePowers;
var formatMultiCallBignumber = function (data) {
    return data.map(function (item) {
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
var getLogicAbi = function (chainId) {
    return LogicAbi[chainId];
};
exports.getLogicAbi = getLogicAbi;
var getErc1155Token = function (addresses) {
    var erc1155Addresses = addresses.filter(exports.isErc1155Address);
    var result = {};
    for (var i = 0; i < erc1155Addresses.length; i++) {
        var address = erc1155Addresses[i].split('-')[0];
        var id = erc1155Addresses[i].split('-')[1];
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
var isErc1155Address = function (address) {
    return /^0x[0-9,a-f,A-Z]{40}-[0-9]{1,}$/g.test(address);
};
exports.isErc1155Address = isErc1155Address;
var getNormalAddress = function (addresses) {
    return addresses.filter(function (adr) { return /^0x[0-9,a-f,A-Z]{40}$/g.test(adr); });
};
exports.getNormalAddress = getNormalAddress;
var formatFloat = function (number, decimal) {
    if (!decimal) {
        decimal = (0, exports.detectDecimalFromPrice)(number);
    }
    number = number.toString();
    var arr = number.split('.');
    if (arr.length > 1) {
        arr[1] = arr[1].slice(0, decimal);
    }
    return Number(arr.join('.'));
};
exports.formatFloat = formatFloat;
var formatPercent = function (floatNumber, decimal) {
    if (decimal === void 0) { decimal = 2; }
    floatNumber = floatNumber.toString();
    return (0, exports.formatFloat)((0, exports.weiToNumber)((0, exports.numberToWei)(floatNumber), 16), decimal);
};
exports.formatPercent = formatPercent;
var mul = function (a, b) {
    var _a;
    var result = (0, exports.weiToNumber)(ethers_1.BigNumber.from((0, exports.numberToWei)(a)).mul((0, exports.numberToWei)(b)), 36);
    var arr = result.split('.');
    arr[1] = (_a = arr[1]) === null || _a === void 0 ? void 0 : _a.slice(0, 18);
    return arr[1] ? arr.join('.') : arr.join('');
};
exports.mul = mul;
var sub = function (a, b) {
    return (0, exports.weiToNumber)(ethers_1.BigNumber.from((0, exports.numberToWei)(a)).sub((0, exports.numberToWei)(b)));
};
exports.sub = sub;
var div = function (a, b) {
    if (!b || b.toString() === '0') {
        return '0';
    }
    return (0, exports.weiToNumber)(ethers_1.BigNumber.from((0, exports.numberToWei)(a, 36)).div((0, exports.numberToWei)(b)));
};
exports.div = div;
var add = function (a, b) {
    return (0, exports.weiToNumber)(ethers_1.BigNumber.from((0, exports.numberToWei)(a)).add((0, exports.numberToWei)(b)));
};
exports.add = add;
var detectDecimalFromPrice = function (price) {
    if (Number(price || 0) === 0 || Number(price || 0) >= 1) {
        return 4;
    }
    else {
        var rate = !(0, exports.bn)((0, exports.numberToWei)(price)).isZero()
            ? (0, exports.weiToNumber)(ethers_1.BigNumber.from((0, exports.numberToWei)(1, 36)).div((0, exports.numberToWei)(price)).toString())
            : '0';
        return rate.split('.')[0].length + 3;
    }
};
exports.detectDecimalFromPrice = detectDecimalFromPrice;
//# sourceMappingURL=helper.js.map