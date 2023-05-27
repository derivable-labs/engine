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
const UTR_json_1 = __importDefault(require("../abi/UTR.json"));
const Logic_json_1 = __importDefault(require("../abi/Logic.json"));
const UTROverride_json_1 = __importDefault(require("../abi/UTROverride.json"));
const Pool_json_1 = __importDefault(require("../abi/Pool.json"));
const Helper_json_1 = __importDefault(require("../abi/Helper.json"));
const Wrap_json_1 = __importDefault(require("../abi/Wrap.json"));
// type ConfigType = {
//   account?: string
//   chainId: number
//   scanApi: string
//   provider: ethers.providers.Provider
//   overrideProvider: JsonRpcProvider
//   signer?: ethers.providers.JsonRpcSigner
//   UNIV2PAIR: UniV2Pair
//   CURRENT_POOL: CurrentPool
// }
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
const CALL_VALUE = 2;
const mode = (x) => ethers_1.ethers.utils.formatBytes32String(x);
class Swap {
    constructor(config) {
        this.config = config;
        this.account = config.account;
        this.chainId = config.chainId;
        this.scanApi = config.scanApi;
        this.provider = config.provider;
        this.overrideProvider = config.overrideProvider;
        this.signer = config.signer;
        this.CURRENT_POOL = config.CURRENT_POOL;
    }
    //@ts-ignore
    calculateAmountOuts(steps) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signer)
                return [[(0, helper_1.bn)(0)], (0, helper_1.bn)(0)];
            try {
                const stepsToSwap = [...steps].map((step) => {
                    return Object.assign(Object.assign({}, step), { amountOutMin: 0 });
                });
                const { params, value } = yield this.convertStepToActions(stepsToSwap);
                const router = this.config.addresses.router;
                // @ts-ignore
                this.overrideProvider.setStateOverride({
                    [router]: {
                        code: UTROverride_json_1.default.deployedBytecode,
                    },
                });
                const contract = new ethers_1.ethers.Contract(router, UTROverride_json_1.default.abi, this.overrideProvider);
                const res = yield contract.callStatic.exec(...params, {
                    from: this.account,
                    value,
                    gasLimit: gasLimit || undefined,
                });
                const result = [];
                for (const i in steps) {
                    result.push(Object.assign(Object.assign({}, steps[i]), { amountOut: res[0][i] }));
                }
                return [result, (0, helper_1.bn)(gasLimit).sub(res.gasLeft)];
            }
            catch (e) {
                console.error(e);
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
                amountOutMin: 0,
            });
        }
        return stepsToSwap;
    }
    callStaticMultiSwap({ params, value, gasLimit }) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = this.getRouterContract(this.signer);
            return yield contract.callStatic.exec(...params, {
                value: value || (0, helper_1.bn)(0),
                gasLimit: gasLimit || undefined,
            });
        });
    }
    // convertStepForPoolErc1155(steps: SwapStepType[]): {
    //   stepsToSwap: PoolErc1155StepType[]
    //   value: BigNumber
    // } {
    //   let value = bn(0)
    //   steps.forEach((step) => {
    //     if (step.tokenIn === NATIVE_ADDRESS) {
    //       value = value.add(step.amountIn)
    //     }
    //   })
    //
    //   const stepsToSwap = steps.map((step) => {
    //     return {
    //       idIn: this.getIdByAddress(step.tokenIn),
    //       idOut: this.getIdByAddress(step.tokenOut),
    //       amountIn: step.amountIn,
    //       amountOutMin: step.amountOutMin,
    //     }
    //   })
    //
    //   return { stepsToSwap, value }
    // }
    convertStepToActions(steps) {
        return __awaiter(this, void 0, void 0, function* () {
            const stateCalHelper = this.getStateCalHelperContract(constant_1.ZERO_ADDRESS);
            let outputs = [];
            steps.forEach((step) => {
                const poolGroup = this.getPoolPoolGroup(step.tokenIn, step.tokenOut);
                outputs.push({
                    recipient: this.account,
                    eip: (0, helper_1.isErc1155Address)(step.tokenOut)
                        ? 1155
                        : step.tokenOut === constant_1.NATIVE_ADDRESS
                            ? 0
                            : 20,
                    token: (0, helper_1.isErc1155Address)(step.tokenOut)
                        ? this.CURRENT_POOL.TOKEN
                        : step.tokenOut,
                    id: (0, helper_1.isErc1155Address)(step.tokenOut)
                        ? (0, helper_1.packId)(this.getIdByAddress(step.tokenOut, poolGroup.TOKEN_R).toString(), this.getAddressByErc1155Address(step.tokenOut, poolGroup.TOKEN_R))
                        : (0, helper_1.bn)(0),
                    amountOutMin: step.amountOutMin,
                });
            });
            let nativeAmountToWrap = (0, helper_1.bn)(0);
            let withdrawWrapToNative = false;
            const metaDatas = [];
            const promises = [];
            steps.forEach((step) => {
                const poolGroup = this.getPoolPoolGroup(step.tokenIn, step.tokenOut);
                if ((step.tokenIn === constant_1.NATIVE_ADDRESS || step.tokenOut === constant_1.NATIVE_ADDRESS) &&
                    poolGroup.TOKEN_R !== this.config.addresses.wrapToken) {
                    throw 'This pool do not support swap by native Token';
                }
                const poolIn = this.getAddressByErc1155Address(step.tokenIn, poolGroup.TOKEN_R);
                const poolOut = this.getAddressByErc1155Address(step.tokenOut, poolGroup.TOKEN_R);
                let idIn = this.getIdByAddress(step.tokenIn, poolGroup.TOKEN_R);
                const idOut = this.getIdByAddress(step.tokenOut, poolGroup.TOKEN_R);
                if (step.tokenIn === constant_1.NATIVE_ADDRESS) {
                    nativeAmountToWrap = nativeAmountToWrap.add(step.amountIn);
                }
                if (step.tokenOut === constant_1.NATIVE_ADDRESS) {
                    withdrawWrapToNative = true;
                }
                if (poolIn === poolOut ||
                    poolOut === poolGroup.TOKEN_R ||
                    poolIn === poolGroup.TOKEN_R) {
                    const poolAddress = (0, helper_1.isErc1155Address)(step.tokenIn) ? poolIn : poolOut;
                    let inputs = [
                        {
                            mode: PAYMENT,
                            eip: (0, helper_1.isErc1155Address)(step.tokenIn) ? 1155 : 20,
                            token: (0, helper_1.isErc1155Address)(step.tokenIn)
                                ? this.CURRENT_POOL.TOKEN
                                : poolGroup.TOKEN_R,
                            id: (0, helper_1.isErc1155Address)(step.tokenIn)
                                ? (0, helper_1.packId)(idIn.toString(), poolIn)
                                : 0,
                            amountIn: step.amountIn,
                            recipient: poolAddress,
                        },
                    ];
                    if (step.tokenIn === constant_1.NATIVE_ADDRESS) {
                        inputs = [
                            {
                                mode: CALL_VALUE,
                                token: constant_1.ZERO_ADDRESS,
                                eip: 0,
                                id: 0,
                                amountIn: step.amountIn,
                                recipient: constant_1.ZERO_ADDRESS,
                            },
                        ];
                    }
                    metaDatas.push({
                        code: this.config.addresses.stateCalHelper,
                        inputs,
                    });
                    promises.push(stateCalHelper.populateTransaction.swap({
                        sideIn: idIn,
                        poolIn: poolAddress,
                        sideOut: idOut,
                        poolOut: poolAddress,
                        amountIn: step.amountIn,
                        payer: this.account,
                        recipient: this.account,
                    }));
                }
                else {
                    metaDatas.push({
                        code: this.config.addresses.stateCalHelper,
                        inputs: [
                            {
                                mode: PAYMENT,
                                eip: 1155,
                                token: this.CURRENT_POOL.TOKEN,
                                id: (0, helper_1.packId)(idIn.toString(), poolIn),
                                amountIn: step.amountIn,
                                recipient: poolIn,
                            },
                        ],
                    });
                    promises.push(stateCalHelper.populateTransaction.swap({
                        sideIn: idIn,
                        poolIn,
                        sideOut: idOut,
                        poolOut,
                        amountIn: step.amountIn,
                        payer: this.account,
                        recipient: this.account,
                        TOKEN: this.CURRENT_POOL.TOKEN,
                    }));
                }
            });
            const datas = yield Promise.all(promises);
            const actions = [];
            //@ts-ignore
            metaDatas.forEach((metaData, key) => {
                actions.push(Object.assign(Object.assign({}, metaData), { data: datas[key].data }));
            });
            // if (nativeAmountToWrap.gt(0)) {
            //   const poolContract = this.getWrapContract()
            //
            //   const data = await poolContract.populateTransaction.deposit()
            //   actions.unshift({
            //     flags: 0,
            //     code: this.config.wrapToken,
            //     //@ts-ignore
            //     data: data.data,
            //     inputs: [{
            //       mode: CALL_VALUE,
            //       eip: 0,
            //       token: ZERO_ADDRESS,
            //       id: 0,
            //       amountIn: nativeAmountToWrap,
            //       recipient: ZERO_ADDRESS,
            //     }]
            //   })
            // }
            return { params: [outputs, actions], value: nativeAmountToWrap };
        });
    }
    getIdByAddress(address, TOKEN_R) {
        try {
            if (address === TOKEN_R)
                return (0, helper_1.bn)(constant_1.POOL_IDS.R);
            if (address === constant_1.NATIVE_ADDRESS &&
                TOKEN_R === this.config.addresses.wrapToken) {
                return (0, helper_1.bn)(constant_1.POOL_IDS.native);
            }
            return (0, helper_1.bn)(address.split('-')[1]);
        }
        catch (e) {
            throw new Error('Token id not found');
        }
    }
    getPoolPoolGroup(addressIn, addressOut) {
        const poolIn = (0, helper_1.isErc1155Address)(addressIn)
            ? this.CURRENT_POOL.pools[addressIn.split('-')[0]]
            : null;
        const poolOut = (0, helper_1.isErc1155Address)(addressOut)
            ? this.CURRENT_POOL.pools[addressOut.split('-')[0]]
            : null;
        if (!poolIn && !poolOut) {
            throw 'Cannot detect pool to swap';
        }
        if (poolIn && poolOut && poolIn.TOKEN_R !== poolOut.TOKEN_R) {
            throw 'Cannot swap throw multi pool (need to same Token R)';
        }
        const result = { pools: {}, TOKEN_R: '' };
        if (poolIn) {
            result.pools[poolIn.poolAddress] = poolIn;
            result.TOKEN_R = poolIn.TOKEN_R;
        }
        if (poolOut) {
            result.pools[poolOut.poolAddress] = poolOut;
            result.TOKEN_R = poolOut.TOKEN_R;
        }
        return result;
    }
    multiSwap(steps, gasLimit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { params, value } = yield this.convertStepToActions([...steps]);
                yield this.callStaticMultiSwap({
                    params,
                    value,
                    gasLimit,
                });
                const contract = this.getRouterContract(this.signer);
                const res = yield contract.exec(...params, {
                    value,
                    gasLimit: gasLimit || undefined,
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
    updateLeverageAndSize(rawStep, gasLimit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const steps = this.formatSwapSteps(rawStep);
                return yield this.multiSwap(steps, gasLimit);
            }
            catch (e) {
                throw e;
            }
        });
    }
    getAddressByErc1155Address(address, TOKEN_R) {
        if ((0, helper_1.isErc1155Address)(address)) {
            return address.split('-')[0];
        }
        if (address === constant_1.NATIVE_ADDRESS &&
            TOKEN_R === this.config.addresses.wrapToken) {
            return this.config.addresses.wrapToken;
        }
        return address;
    }
    getRouterContract(provider) {
        return new ethers_1.ethers.Contract(this.config.addresses.router, UTR_json_1.default, provider);
    }
    getStateCalHelperContract(address, provider) {
        return new ethers_1.ethers.Contract(address, Helper_json_1.default, provider || this.provider);
    }
    getPoolContract(poolAddress, provider) {
        return new ethers_1.ethers.Contract(poolAddress, Pool_json_1.default, provider || this.provider);
    }
    getLogicContract(provider) {
        return new ethers_1.ethers.Contract(this.CURRENT_POOL.logicAddress, Logic_json_1.default, provider || this.provider);
    }
    getWrapContract(provider) {
        return new ethers_1.ethers.Contract(this.config.addresses.wrapToken, Wrap_json_1.default, provider || this.provider);
    }
    encodePayload(swapType, sideIn, sideOut, amount, token1155) {
        const abiCoder = new ethers_1.ethers.utils.AbiCoder();
        return abiCoder.encode(['uint', 'uint', 'uint', 'uint', 'address'], [swapType, sideIn, sideOut, amount, token1155]);
    }
}
exports.Swap = Swap;
//# sourceMappingURL=swap.js.map