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
exports.UniV3Pair = void 0;
const ethers_1 = require("ethers");
const PairV3Detail_json_1 = __importDefault(require("../abi/PairV3Detail.json"));
const configs_1 = require("../utils/configs");
const providers_1 = require("@ethersproject/providers");
const FLAG = '0x00001100000000000000000000000000000000000000000000000001111';
class UniV3Pair {
    constructor(configs) {
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.provider = configs.provider;
        this.rpcUrl = configs.rpcUrl;
    }
    getPairInfo({ pairAddress, flag = FLAG }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const provider = new providers_1.JsonRpcProvider(this.rpcUrl);
                // @ts-ignore
                provider.setStateOverride({
                    [configs_1.CONFIGS[this.chainId].pairsV3Info]: {
                        code: PairV3Detail_json_1.default.deployedBytecode
                    }
                });
                const pairDetailContract = new ethers_1.ethers.Contract(configs_1.CONFIGS[this.chainId].pairsV3Info, PairV3Detail_json_1.default.abi, provider);
                const res = yield pairDetailContract.functions.query([pairAddress], flag);
                return res.details[0];
            }
            catch (e) {
                throw e;
            }
        });
    }
    getPairsInfo({ pairAddresses, flag = FLAG }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const provider = new providers_1.JsonRpcProvider(this.rpcUrl);
                // @ts-ignore
                provider.setStateOverride({
                    [configs_1.CONFIGS[this.chainId].pairsV3Info]: {
                        code: PairV3Detail_json_1.default.deployedBytecode
                    }
                });
                const pairDetailContract = new ethers_1.ethers.Contract(configs_1.CONFIGS[this.chainId].pairsV3Info, PairV3Detail_json_1.default.abi, provider);
                const { details } = yield pairDetailContract.functions.query(pairAddresses, flag);
                const result = {};
                for (let i = 0; i < pairAddresses.length; i++) {
                    result[pairAddresses[i]] = {
                        token0: {
                            address: details[i].token0.adr,
                            name: details[i].token0.name,
                            symbol: details[i].token0.symbol,
                            decimal: details[i].token0.decimals,
                        },
                        token1: {
                            address: details[i].token1.adr,
                            name: details[i].token1.name,
                            symbol: details[i].token1.symbol,
                            decimal: details[i].token1.decimals,
                        }
                    };
                }
                return result;
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.UniV3Pair = UniV3Pair;
//# sourceMappingURL=uniV3Pair.js.map