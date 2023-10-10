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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePool = void 0;
const ethers_1 = require("ethers");
const helper_1 = require("../utils/helper");
const providers_1 = require("@ethersproject/providers");
class CreatePool {
    constructor(config, profile) {
        this.account = config.account;
        this.chainId = config.chainId;
        this.scanApi = profile.configs.scanApi;
        this.provider = new providers_1.JsonRpcProvider(profile.configs.rpc);
        this.overrideProvider = new providers_1.JsonRpcProvider(profile.configs.rpc);
        this.signer = config.signer;
        this.profile = profile;
    }
    callStaticCreatePool({ params, value, gasLimit }) {
        return __awaiter(this, void 0, void 0, function* () {
            const helper = this.getStateCalHelperContract(this.signer);
            return yield helper.callStatic.createPool(params, this.contractAddresses.poolFactory, {
                value: value || (0, helper_1.bn)(0),
                gasLimit: gasLimit || undefined,
            });
        });
    }
    createPool(params, gasLimit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newPoolConfigs = this.generateConfig(params.k, params.a, params.b, params.mark, params.recipient, params.oracle, params.initTime, params.halfLife);
                yield this.callStaticCreatePool({
                    params: newPoolConfigs,
                    value: params.amountInit,
                    gasLimit,
                });
                const helper = this.getStateCalHelperContract(this.signer);
                const res = yield helper.createPool(newPoolConfigs, this.contractAddresses.poolFactory, {
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
    generateConfig(k, a, b, mark, recipient, oracle, initTime, halfLife) {
        return {
            utr: this.profile.configs.helperContract.utr,
            token: this.contractAddresses.token,
            logic: this.contractAddresses.logic,
            oracle,
            reserveToken: this.profile.configs.wrappedTokenAddress,
            recipient,
            mark,
            k,
            a,
            b,
            initTime,
            halfLife,
        };
    }
    getStateCalHelperContract(provider) {
        return new ethers_1.ethers.Contract(this.contractAddresses.stateCalHelper, this.profile.getAbi('Helper'), provider || this.provider);
    }
}
exports.CreatePool = CreatePool;
//# sourceMappingURL=createPool.js.map