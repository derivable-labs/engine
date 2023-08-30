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
class Price {
    constructor(config) {
        const { chainId, scanApi, provider, rpcUrl } = config;
        const { reserveTokenPrice } = config.addresses;
        if (!reserveTokenPrice) {
            throw new Error(`required pairsV3Info contract to be defined!`);
        }
        this.config = config;
        this.chainId = chainId;
        this.scanApi = scanApi;
        this.provider = provider;
        this.rpcUrl = rpcUrl;
        this.reserveTokenPrice = reserveTokenPrice;
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
                    barValueType: 'string'
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
                const res = yield pairDetailContract.functions.fetchMarketBatch(tokens, this.config.addresses.uniswapFactory, this.config.stableCoins, this.config.addresses.wrapToken, this.config.stableCoins[0]);
                const result = {};
                for (let i in tokens) {
                    result[tokens[i]] = res.sqrtPriceX96[i];
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