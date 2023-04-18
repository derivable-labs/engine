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
const constant_1 = require("../utils/constant");
const configs_1 = require("../utils/configs");
const Events_json_1 = __importDefault(require("../abi/Events.json"));
const helper_1 = require("../utils/helper");
const historyProvider_1 = __importDefault(require("../historyProvider"));
const Pool_json_1 = __importDefault(require("../abi/Pool.json"));
const SYNC_EVENT_TOPIC = '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1';
class Price {
    constructor(configs) {
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.provider = configs.provider;
        this.providerToGetLog = configs.providerToGetLog;
        this.UNIV2PAIR = configs.UNIV2PAIR;
    }
    get24hChangeByLog({ baseToken, quoteToken, cToken, currentPrice, baseId, headBlock, range = 40, }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!headBlock) {
                    headBlock = yield this.providerToGetLog.getBlockNumber();
                }
                const blocknumber24hAgo = headBlock - Math.floor(constant_1.MINI_SECOND_PER_DAY / configs_1.CONFIGS[this.chainId].timePerBlock);
                const eventInterface = new ethers_1.ethers.utils.Interface(Events_json_1.default);
                const { totalBaseReserve, totalQuoteReserve } = yield this.providerToGetLog.getLogs({
                    address: cToken,
                    fromBlock: blocknumber24hAgo - range,
                    toBlock: blocknumber24hAgo,
                    topics: [SYNC_EVENT_TOPIC]
                }).then((logs) => {
                    return logs.map((log) => {
                        const data = eventInterface.parseLog(log);
                        const [baseReserve, quoteReserve] = baseId === constant_1.POOL_IDS.token0
                            ? [data.args.reserve0, data.args.reserve1]
                            : [data.args.reserve1, data.args.reserve0];
                        return {
                            baseReserve,
                            quoteReserve
                        };
                    });
                }).then((reserves) => {
                    let totalBaseReserve = (0, helper_1.bn)(0);
                    let totalQuoteReserve = (0, helper_1.bn)(0);
                    for (const i in reserves) {
                        totalBaseReserve = totalBaseReserve.add(reserves[i].baseReserve);
                        totalQuoteReserve = totalQuoteReserve.add(reserves[i].quoteReserve);
                    }
                    return { totalBaseReserve, totalQuoteReserve };
                });
                if (totalBaseReserve.gt(0) && totalQuoteReserve.gt(0)) {
                    const price = (0, helper_1.weiToNumber)(totalQuoteReserve.mul((0, helper_1.numberToWei)(1)).div(totalBaseReserve), 18 + (quoteToken.decimal) - (baseToken.decimal));
                    return (0, helper_1.formatPercent)((0, helper_1.div)((0, helper_1.sub)(currentPrice, price), price));
                }
                else {
                    return yield this.get24hChangeByLog({
                        baseToken,
                        quoteToken,
                        cToken,
                        currentPrice,
                        baseId,
                        headBlock,
                        range: range * 2,
                    });
                }
            }
            catch (e) {
                console.error(e);
                return 0;
            }
        });
    }
    get24hChange({ baseToken, cToken, quoteToken, chainId, currentPrice }) {
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
                });
                const beforePrice = result[0].open;
                return (0, helper_1.formatPercent)((0, helper_1.div)((0, helper_1.sub)(currentPrice, beforePrice), beforePrice));
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * @return price of native token
     */
    getNativePrice() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!configs_1.CONFIGS[this.chainId].wrapUsdPair) {
                return '0';
            }
            const res = yield this.UNIV2PAIR.getPairInfo({
                pairAddress: configs_1.CONFIGS[this.chainId].wrapUsdPair
            });
            const [wrapToken, usdToken] = res.token0.adr === configs_1.CONFIGS[this.chainId].wrapToken ? [res.token0, res.token1] : [res.token1, res.token0];
            const priceWei = usdToken.reserve
                .mul((0, helper_1.numberToWei)(1))
                .div(wrapToken.reserve);
            return (0, helper_1.weiToNumber)(priceWei, 18 + usdToken.decimals.toNumber() - wrapToken.decimals.toNumber());
        });
    }
    fetchCpPrice({ states, cToken, poolAddress, cTokenPrice, }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!poolAddress || !cToken || !cTokenPrice || !states) {
                return '0';
            }
            const contract = new ethers_1.ethers.Contract(poolAddress, Pool_json_1.default, this.provider);
            const cpTotalSupply = yield contract.totalSupply(constant_1.POOL_IDS.cp);
            const rBc = states.R.sub(states.rDcNeutral).sub(states.rDcLong).sub(states.rDcShort);
            const p = (0, helper_1.bn)((0, helper_1.numberToWei)(cTokenPrice)).mul(rBc).div(cpTotalSupply);
            return (0, helper_1.weiToNumber)(p);
        });
    }
}
exports.Price = Price;
//# sourceMappingURL=price.js.map