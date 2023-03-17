"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.resolutionToPeriod = void 0;
var helper_1 = require("./utils/helper");
var constant_1 = require("./utils/constant");
var node_fetch_1 = __importDefault(require("node-fetch"));
var history = {};
var convertResolution = function (oldResolution) {
    if (oldResolution.includes('D')) {
        return oldResolution;
    }
    else {
        if (Number(oldResolution) < 60) {
            return oldResolution;
        }
        else {
            return Number(oldResolution) / 60 + 'H';
        }
    }
};
exports.resolutionToPeriod = {
    5: '5m',
    15: '15m',
    60: '1h',
    240: '4h',
    '1D': '1d'
};
exports["default"] = {
    history: history,
    getBars: function (_a) {
        var route = _a.route, resolution = _a.resolution, inputToken = _a.inputToken, outputToken = _a.outputToken, limit = _a.limit, to = _a.to;
        console.log(route);
        var q = route.split('/').join(',');
        var url = "".concat(constant_1.CHART_API_ENDPOINT, "candleline4?q=").concat(q, "&r=").concat(convertResolution(resolution), "&l=").concat(limit, "&t=").concat(to);
        return (0, node_fetch_1["default"])(url)
            .then(function (r) { return r.json(); })
            .then(function (response) {
            var bars = [];
            if (response &&
                response.s === 'ok' &&
                response.t &&
                response.t.length > 0) {
                var decimal = 18 + ((outputToken === null || outputToken === void 0 ? void 0 : outputToken.decimal) || 18) - ((inputToken === null || inputToken === void 0 ? void 0 : inputToken.decimal) || 18);
                for (var i = 0; i < response.t.length; i++) {
                    bars.push({
                        low: Number((0, helper_1.weiToNumber)((0, helper_1.numberToWei)(response.l[i]), decimal)),
                        open: Number((0, helper_1.weiToNumber)((0, helper_1.numberToWei)(response.o[i]), decimal)),
                        time: response.t[i] * 1000,
                        volume: Number((0, helper_1.weiToNumber)(response.v[i].split('.')[0], outputToken === null || outputToken === void 0 ? void 0 : outputToken.decimal)),
                        close: Number((0, helper_1.weiToNumber)((0, helper_1.numberToWei)(response.c[i]), decimal)),
                        high: Number((0, helper_1.weiToNumber)((0, helper_1.numberToWei)(response.h[i]), decimal))
                    });
                }
                return bars;
            }
            else {
                return [];
            }
        })["catch"](function (e) {
            console.error(e);
            return [];
        });
    }
};
//# sourceMappingURL=historyProvider.js.map