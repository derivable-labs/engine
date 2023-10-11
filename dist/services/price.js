"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Price = void 0;
const ethers_1 = require("ethers");
const ReserveTokenPrice_json_1 = __importDefault(require("../abi/ReserveTokenPrice.json"));
const providers_1 = require("@ethersproject/providers");
const helper_1 = require("../utils/helper");
const constant_1 = require("../utils/constant");
const historyProvider_1 = __importDefault(require("../historyProvider"));
const utils_1 = require("ethers/lib/utils");
class Price {
    constructor(config, profile) {
        this.reserveTokenPrice = '0x' + ReserveTokenPrice_json_1.default.deployedBytecode.slice(-40);
        this.chainId = config.chainId;
        this.scanApi = profile.configs.scanApi;
        this.provider = new providers_1.JsonRpcProvider(profile.configs.rpc);
        this.rpcUrl = profile.configs.rpc;
        this.profile = profile;
    }
    get24hChange({ baseToken, cToken, quoteToken, chainId, currentPrice, }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const toTime = Math.floor((new Date().getTime() - constant_1.MINI_SECOND_PER_DAY) / 1000);
                const result = yield historyProvider_1.default.getBars({
                    to: toTime,
                    limit: 1,
                    chainId,
                    resolution: '1',
                    route: `${baseToken.address}/${cToken}/${quoteToken.address}`,
                    outputToken: quoteToken,
                    inputToken: baseToken,
                    barValueType: 'string',
                });
                const beforePrice = result[0].open;
                return (0, helper_1.formatPercent)((0, helper_1.div)((0, helper_1.sub)(currentPrice, beforePrice), beforePrice));
            }
            catch (e) {
                throw e;
            }
        });
    }
    getTokenPrices(tokens) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const provider = new providers_1.JsonRpcProvider(this.rpcUrl);
                // @ts-ignore
                provider.setStateOverride({
                    [this.reserveTokenPrice]: {
                        code: ReserveTokenPrice_json_1.default.deployedBytecode,
                    },
                });
                const pairDetailContract = new ethers_1.ethers.Contract(this.reserveTokenPrice, ReserveTokenPrice_json_1.default.abi, provider);
                const whiteListToken = this.profile.configs.tokens;
                const _tokensToFetch = tokens.filter((t) => {
                    var _a;
                    return !((_a = whiteListToken === null || whiteListToken === void 0 ? void 0 : whiteListToken[t]) === null || _a === void 0 ? void 0 : _a.price) && (0, utils_1.isAddress)(t);
                });
                const res = yield pairDetailContract.functions.fetchMarketBatch(_tokensToFetch, this.profile.configs.uniswap.v3Factory, this.profile.configs.stablecoins, this.profile.configs.wrappedTokenAddress, this.profile.configs.stablecoins[0]);
                const result = {};
                for (let i in _tokensToFetch) {
                    result[_tokensToFetch[i]] = res.sqrtPriceX96[i];
                }
                if (whiteListToken) {
                    for (let address in whiteListToken) {
                        if (whiteListToken[address].price) {
                            result[address] = (0, helper_1.bn)(whiteListToken[address].price || '0x01000000000000000000000000');
                        }
                    }
                }
                return result;
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.Price = Price;
//# sourceMappingURL=price.js.map