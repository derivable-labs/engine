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
exports.Swap = void 0;
const ethers_1 = require("ethers");
const helper_1 = require("../utils/helper");
const constant_1 = require("../utils/constant");
const configs_1 = require("../utils/configs");
const UTR_json_1 = __importDefault(require("../abi/UTR.json"));
const Logic_json_1 = __importDefault(require("../abi/Logic.json"));
const UTROverride_json_1 = __importDefault(require("../abi/UTROverride.json"));
const Pool_json_1 = __importDefault(require("../abi/Pool.json"));
const Wrap_json_1 = __importDefault(require("../abi/Wrap.json"));
// TODO: don't hardcode these
const fee10000 = 30;
const gasLimit = 6000000;
const ACTION_RECORD_CALL_RESULT = 2;
const ACTION_INJECT_CALL_RESULT = 4;
const AMOUNT_EXACT = 0;
const AMOUNT_ALL = 1;
const TRANSFER_FROM_SENDER = 0;
const TRANSFER_FROM_ROUTER = 1;
const TRANSFER_CALL_VALUE = 2;
const IN_TX_PAYMENT = 4;
const FROM_ROUTER = 10;
const PAYMENT = 0;
const TRANSFER = 1;
const ALLOWANCE = 2;
const CALL_VALUE = 3;
const mode = (x) => ethers_1.ethers.utils.formatBytes32String(x);
class Swap {
    constructor(configs) {
        this.account = configs.account;
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.provider = configs.provider;
        this.overrideProvider = configs.overrideProvider;
        this.signer = configs.signer;
        this.CURRENT_POOL = configs.CURRENT_POOL;
    }
    getDeleverageStep() {
        return __awaiter(this, void 0, void 0, function* () {
            const { priceScaleLong, twapBase } = this.CURRENT_POOL.states;
            const [start, end] = twapBase.lt(priceScaleLong) ?
                [twapBase, priceScaleLong] : [priceScaleLong, twapBase];
            const logicContract = this.getLogicContract();
            const data = (yield logicContract.populateTransaction.deleverage(start.div(2), end.mul(2))).data;
            return {
                flags: 0,
                code: this.CURRENT_POOL.logicAddress,
                data: data,
                inputs: [{
                        mode: 2,
                        recipient: this.CURRENT_POOL.poolAddress,
                        eip: 0,
                        id: 0,
                        token: constant_1.ZERO_ADDRESS,
                        amountInMax: 0,
                        amountSource: 0,
                    }]
            };
        });
    }
    //@ts-ignore
    calculateAmountOuts(steps, isDeleverage = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer)
                return [[(0, helper_1.bn)(0)], (0, helper_1.bn)(0)];
            try {
                const stepsToSwap = [...steps].map((step) => {
                    return Object.assign(Object.assign({}, step), { amountOutMin: 0 });
                });
                const { params, value } = yield this.convertStepToActions(stepsToSwap);
                if (isDeleverage) {
                    params[1].unshift(yield this.getDeleverageStep());
                }
                const router = configs_1.CONFIGS[this.chainId].router;
                // @ts-ignore
                this.overrideProvider.setStateOverride({
                    [router]: {
                        code: UTROverride_json_1.default.deployedBytecode
                    }
                });
                const contract = new ethers_1.ethers.Contract(router, UTROverride_json_1.default.abi, this.overrideProvider);
                const res = yield contract.callStatic.exec(...params, {
                    from: this.account,
                    value,
                    gasLimit: gasLimit || undefined
                });
                const result = [];
                for (const i in steps) {
                    result.push(Object.assign(Object.assign({}, steps[i]), { amountOut: res[0][i] }));
                }
                return [result, (0, helper_1.bn)(gasLimit).sub(res.gasLeft)];
            }
            catch (e) {
                console.log(e);
                return [[(0, helper_1.bn)(0)], (0, helper_1.bn)(0)];
            }
        });
    }
    //
    formatSwapSteps(steps) {
        const stepsToSwap = [];
        for (const i in steps) {
            const step = steps[i];
            const tokenIn = this.CURRENT_POOL.getTokenByPower(step.tokenIn) || step.tokenIn;
            const tokenOut = this.CURRENT_POOL.getTokenByPower(step.tokenOut) || step.tokenOut;
            if (step.amountIn.isZero() || !tokenIn || !tokenOut) {
                continue;
            }
            stepsToSwap.push({
                tokenIn,
                tokenOut,
                amountIn: step.amountIn,
                amountOutMin: 0
            });
        }
        return stepsToSwap;
    }
    callStaticMultiSwap({ params, value, gasLimit }) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = this.getRouterContract(this.signer);
            return yield contract.callStatic.exec(...params, {
                value: value || (0, helper_1.bn)(0),
                gasLimit: gasLimit || undefined
            });
        });
    }
    convertStepForPoolErc1155(steps) {
        let value = (0, helper_1.bn)(0);
        steps.forEach((step) => {
            if (step.tokenIn === configs_1.CONFIGS[this.chainId].nativeToken) {
                value = value.add(step.amountIn);
            }
        });
        const stepsToSwap = steps.map((step) => {
            return {
                idIn: this.getIdByAddress(step.tokenIn),
                idOut: this.getIdByAddress(step.tokenOut),
                amountIn: step.amountIn,
                amountOutMin: step.amountOutMin
            };
        });
        return { stepsToSwap, value };
    }
    convertStepToActions(steps) {
        return __awaiter(this, void 0, void 0, function* () {
            const poolContract = this.getPoolContract(constant_1.ZERO_ADDRESS);
            const outputs = [];
            // steps.forEach((step) => {
            //   outputs.push({
            //     eip: isErc1155Address(step.tokenOut) ? 1155 : 20,
            //     token: this.getAddressByErc1155Address(step.tokenOut),
            //     id: isErc1155Address(step.tokenOut) ? this.getIdByAddress(step.tokenOut) : bn(0),
            //     amountOutMin: step.amountOutMin,
            //     recipient: this.account,
            //   })
            // })
            let nativeAmountToWrap = (0, helper_1.bn)(0);
            let withdrawWrapToNative = false;
            const promises = [];
            steps.forEach((step) => {
                if ((step.tokenIn === configs_1.CONFIGS[this.chainId].nativeToken ||
                    step.tokenOut === configs_1.CONFIGS[this.chainId].nativeToken) &&
                    this.CURRENT_POOL.TOKEN_R !== configs_1.CONFIGS[this.chainId].wrapToken) {
                    throw "This pool do not support swap by native Token";
                }
                let idIn = this.getIdByAddress(step.tokenIn);
                if (step.tokenIn === configs_1.CONFIGS[this.chainId].nativeToken) {
                    nativeAmountToWrap = nativeAmountToWrap.add(step.amountIn);
                }
                if (step.tokenOut === configs_1.CONFIGS[this.chainId].nativeToken) {
                    withdrawWrapToNative = true;
                }
                const idOut = this.getIdByAddress(step.tokenOut);
                promises.push(poolContract.populateTransaction.swap(idIn, idOut, configs_1.CONFIGS[this.chainId].stateCalHelper, this.encodePayload(0, idIn, idOut, step.amountIn, configs_1.CONFIGS[this.chainId].token), step.tokenIn === configs_1.CONFIGS[this.chainId].nativeToken ? constant_1.ZERO_ADDRESS : this.account, this.account));
            });
            const datas = yield Promise.all(promises);
            const actions = [];
            //@ts-ignore
            steps.forEach((step, key) => {
                const poolAddress = (0, helper_1.isErc1155Address)(step.tokenIn)
                    ? this.getAddressByErc1155Address(step.tokenIn)
                    : this.getAddressByErc1155Address(step.tokenOut);
                actions.push({
                    flags: 0,
                    code: poolAddress,
                    data: datas[key].data,
                    inputs: [{
                            mode: step.tokenIn === configs_1.CONFIGS[this.chainId].nativeToken ? ALLOWANCE + FROM_ROUTER : PAYMENT,
                            eip: (0, helper_1.isErc1155Address)(step.tokenIn) ? 1155 : 20,
                            token: this.getAddressByErc1155Address(step.tokenIn),
                            id: (0, helper_1.isErc1155Address)(step.tokenIn) ? this.getIdByAddress(step.tokenIn) : 0,
                            amountIn: step.amountIn,
                            recipient: poolAddress,
                        }]
                });
            });
            if (nativeAmountToWrap.gt(0)) {
                const poolContract = this.getWrapContract();
                const data = yield poolContract.populateTransaction.deposit();
                actions.unshift({
                    flags: 0,
                    code: configs_1.CONFIGS[this.chainId].wrapToken,
                    //@ts-ignore
                    data: data.data,
                    inputs: [{
                            mode: CALL_VALUE,
                            eip: 0,
                            token: constant_1.ZERO_ADDRESS,
                            id: 0,
                            amountIn: nativeAmountToWrap,
                            recipient: constant_1.ZERO_ADDRESS,
                        }]
                });
            }
            return { params: [outputs, actions], value: nativeAmountToWrap };
        });
    }
    getIdByAddress(address) {
        try {
            if (address === this.CURRENT_POOL.TOKEN_R)
                return (0, helper_1.bn)(constant_1.POOL_IDS.R);
            if (address === configs_1.CONFIGS[this.chainId].nativeToken &&
                this.CURRENT_POOL.TOKEN_R === configs_1.CONFIGS[this.chainId].wrapToken) {
                return (0, helper_1.bn)(constant_1.POOL_IDS.R);
            }
            return (0, helper_1.bn)(address.split('-')[1]);
        }
        catch (e) {
            throw new Error('Token id not found');
        }
    }
    multiSwap(steps, gasLimit, isDeleverage = false) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { params, value } = yield this.convertStepToActions([...steps]);
                if (isDeleverage) {
                    params.unshift(this.getDeleverageStep());
                }
                yield this.callStaticMultiSwap({ params, value, gasLimit });
                const contract = this.getRouterContract(this.signer);
                const res = yield contract.exec(...params, {
                    value,
                    gasLimit: gasLimit || undefined
                });
                const tx = yield res.wait(1);
                console.log('tx', tx);
                return tx;
            }
            catch (e) {
                throw e;
            }
        });
    }
    updateLeverageAndSize(rawStep, gasLimit, isDeleverage = false) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const steps = this.formatSwapSteps(rawStep);
                return yield this.multiSwap(steps, gasLimit, isDeleverage);
            }
            catch (e) {
                throw e;
            }
        });
    }
    getAddressByErc1155Address(address) {
        if ((0, helper_1.isErc1155Address)(address)) {
            return address.split('-')[0];
        }
        if (address === configs_1.CONFIGS[this.chainId].nativeToken &&
            this.CURRENT_POOL.TOKEN_R === configs_1.CONFIGS[this.chainId].wrapToken) {
            return configs_1.CONFIGS[this.chainId].wrapToken;
        }
        return address;
    }
    getRouterContract(provider) {
        return new ethers_1.ethers.Contract(configs_1.CONFIGS[this.chainId].router, UTR_json_1.default, provider);
    }
    getPoolContract(poolAddress, provider) {
        return new ethers_1.ethers.Contract(poolAddress, Pool_json_1.default, provider || this.provider);
    }
    getLogicContract(provider) {
        return new ethers_1.ethers.Contract(this.CURRENT_POOL.logicAddress, Logic_json_1.default, provider || this.provider);
    }
    getWrapContract(provider) {
        return new ethers_1.ethers.Contract(configs_1.CONFIGS[this.chainId].wrapToken, Wrap_json_1.default, provider || this.provider);
    }
    encodePayload(swapType, sideIn, sideOut, amount, token1155) {
        const abiCoder = new ethers_1.ethers.utils.AbiCoder();
        return abiCoder.encode(["uint", "uint", "uint", "uint", "address"], [swapType, sideIn, sideOut, amount, token1155]);
    }
}
exports.Swap = Swap;
//# sourceMappingURL=swap.js.map