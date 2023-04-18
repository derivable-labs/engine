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
const constant_1 = require("../utils/constant");
const PoolFactory_json_1 = __importDefault(require("../abi/PoolFactory.json"));
const UTR_json_1 = __importDefault(require("../abi/UTR.json"));
const Wrap_json_1 = __importDefault(require("../abi/Wrap.json"));
// utr
const FROM_ROUTER = 10;
const PAYMENT = 0;
const TRANSFER = 1;
const ALLOWANCE = 2;
const CALL_VALUE = 3;
class CreatePool {
    constructor(configs) {
        this.account = configs.account;
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.provider = configs.provider;
        this.overrideProvider = configs.overrideProvider;
        this.signer = configs.signer;
    }
    createPool(params, gasLimit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const poolFactoryContract = this.getPoolFactoryContract(this.signer);
                const wrapToken = this.getWrapTokenContract(this.signer);
                const newPoolConfigs = this.generateConfig(params.k, params.a, params.b, params.mark, params.recipient, params.oracle, params.halfLife);
                const poolAddress = yield poolFactoryContract.computePoolAddress(newPoolConfigs, {
                    gasLimit: gasLimit || undefined,
                });
                const utr = this.getRouterContract(this.signer);
                const res = yield utr.exec([], [
                    {
                        inputs: [
                            {
                                mode: CALL_VALUE,
                                eip: 0,
                                token: constant_1.ZERO_ADDRESS,
                                id: 0,
                                amountIn: params.amountInit,
                                recipient: constant_1.ZERO_ADDRESS,
                            },
                        ],
                        flags: 0,
                        code: configs_1.CONFIGS[this.chainId].wrapToken,
                        data: (yield wrapToken.populateTransaction.deposit()).data,
                    },
                    {
                        inputs: [
                            {
                                mode: TRANSFER + FROM_ROUTER,
                                eip: 20,
                                token: configs_1.CONFIGS[this.chainId].wrapToken,
                                id: 0,
                                amountIn: 0,
                                recipient: poolAddress,
                            },
                        ],
                        flags: 0,
                        code: configs_1.CONFIGS[this.chainId].poolFactory,
                        data: (yield poolFactoryContract.populateTransaction.createPool(newPoolConfigs)).data,
                    },
                ], {
                    value: params.amountInit,
                    gasLimit: gasLimit || undefined,
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
    generateConfig(k, a, b, mark, recipient, oracle, halfLife) {
        return {
            utr: configs_1.CONFIGS[this.chainId].router,
            token: configs_1.CONFIGS[this.chainId].token,
            logic: configs_1.CONFIGS[this.chainId].logic,
            oracle,
            reserveToken: configs_1.CONFIGS[this.chainId].wrapToken,
            recipient: recipient,
            mark,
            k,
            a,
            b,
            halfLife
        };
    }
    getRouterContract(provider) {
        return new ethers_1.ethers.Contract(configs_1.CONFIGS[this.chainId].router, UTR_json_1.default, provider);
    }
    getWrapTokenContract(provider) {
        return new ethers_1.ethers.Contract(configs_1.CONFIGS[this.chainId].wrapToken, Wrap_json_1.default, provider);
    }
    getPoolFactoryContract(provider) {
        return new ethers_1.ethers.Contract(configs_1.CONFIGS[this.chainId].poolFactory, PoolFactory_json_1.default, provider);
    }
}
exports.CreatePool = CreatePool;
//# sourceMappingURL=createPool.js.map