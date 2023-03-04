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
exports.CreatePool = void 0;
const ethers_1 = require("ethers");
const configs_1 = require("../utils/configs");
const PoolFactory_json_1 = __importDefault(require("../abi/PoolFactory.json"));
class CreatePool {
    constructor(configs) {
        this.account = configs.account;
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.provider = configs.provider;
        this.overrideProvider = configs.overrideProvider;
        this.signer = configs.signer;
    }
    encodePowers(powers) {
        let powersBytes = [];
        for (let i = powers.length - 1; i >= 0; --i) {
            let power = powers[i];
            if (power < 0) {
                power = 0x8000 - power;
            }
            powersBytes.push(...ethers_1.ethers.utils.zeroPad(power, 2));
        }
        const encoded = ethers_1.ethers.utils.hexZeroPad(powers.length, 2) + ethers_1.ethers.utils.hexZeroPad(powersBytes, 30).slice(2);
        return encoded;
    }
    createPool(params, gasLimit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const poolFactoryContract = new ethers_1.ethers.Contract(configs_1.CONFIGS[this.chainId].poolFactory, PoolFactory_json_1.default, this.signer);
                const newPoolConfigs = {
                    UTR: configs_1.CONFIGS[this.chainId].router,
                    logic: configs_1.CONFIGS[this.chainId].logic,
                    pairToken: configs_1.CONFIGS[this.chainId].wrapUsdPair,
                    baseToken: configs_1.CONFIGS[this.chainId].wrapToken,
                    priceToleranceRatio: params.priceToleranceRatio,
                    rentRate: params.rentRate,
                    deleverageRate: params.deleverageRate,
                    powers: this.encodePowers(params.powers),
                    feeRecipient: this.account,
                    feeDenominator: 33,
                };
                const res = yield poolFactoryContract.createPool(newPoolConfigs, {
                    gasLimit: gasLimit || undefined
                });
                const tx = yield res.wait(1);
                console.log('tx', tx);
                return true;
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.CreatePool = CreatePool;
//# sourceMappingURL=createPool.js.map