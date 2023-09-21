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
exports.Swap = void 0;
const ethers_1 = require("ethers");
const helper_1 = require("../utils/helper");
const constant_1 = require("../utils/constant");
const providers_1 = require("@ethersproject/providers");
const utils_1 = require("ethers/lib/utils");
const PAYMENT = 0;
const TRANSFER = 1;
const CALL_VALUE = 2;
class Swap {
    constructor(config, profile) {
        this.config = config;
        this.account = config.account;
        this.chainId = config.chainId;
        this.scanApi = profile.configs.scanApi;
        this.provider = new providers_1.JsonRpcProvider(profile.configs.rpc);
        this.provider = new ethers_1.ethers.providers.JsonRpcProvider(profile.configs.rpc);
        this.overrideProvider = new providers_1.JsonRpcProvider(profile.configs.rpc);
        this.signer = config.signer;
        this.RESOURCE = config.RESOURCE;
        this.profile = profile;
        this.derivableAdr = profile.configs.derivable;
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
                const router = this.profile.configs.helperContract.utr;
                // @ts-ignore
                this.overrideProvider.setStateOverride({
                    [router]: {
                        code: this.profile.getAbi('UTROverride').deployedBytecode,
                    },
                });
                const contract = new ethers_1.ethers.Contract(router, this.profile.getAbi('UTROverride').abi, this.overrideProvider);
                const res = yield contract.callStatic.exec(...params, {
                    from: this.account,
                    value,
                    gasLimit: this.profile.configs.gasLimitDefault,
                });
                const result = [];
                for (const i in steps) {
                    result.push(Object.assign(Object.assign({}, steps[i]), { amountOut: res[0][i] }));
                }
                return [result, (0, helper_1.bn)(this.profile.configs.gasLimitDefault).sub(res.gasLeft)];
            }
            catch (e) {
                throw e;
            }
        });
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
    convertStepToActions(steps) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            const stateCalHelper = this.getStateCalHelperContract();
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
                        ? this.derivableAdr.token
                        : step.tokenOut,
                    id: (0, helper_1.isErc1155Address)(step.tokenOut)
                        ? (0, helper_1.packId)(this.getIdByAddress(step.tokenOut, poolGroup.TOKEN_R).toString(), this.getAddressByErc1155Address(step.tokenOut, poolGroup.TOKEN_R))
                        : (0, helper_1.bn)(0),
                    amountOutMin: step.amountOutMin,
                });
            });
            let nativeAmountToWrap = (0, helper_1.bn)(0);
            const metaDatas = [];
            const promises = [];
            steps.forEach((step) => {
                const poolGroup = this.getPoolPoolGroup(step.tokenIn, step.tokenOut);
                if ((step.tokenIn === constant_1.NATIVE_ADDRESS || step.tokenOut === constant_1.NATIVE_ADDRESS) &&
                    poolGroup.TOKEN_R !== this.profile.configs.wrappedTokenAddress) {
                    throw 'This pool do not support swap by native Token';
                }
                const poolIn = this.getAddressByErc1155Address(step.tokenIn, poolGroup.TOKEN_R);
                const poolOut = this.getAddressByErc1155Address(step.tokenOut, poolGroup.TOKEN_R);
                let idIn = this.getIdByAddress(step.tokenIn, poolGroup.TOKEN_R);
                const idOut = this.getIdByAddress(step.tokenOut, poolGroup.TOKEN_R);
                if (step.tokenIn === constant_1.NATIVE_ADDRESS) {
                    nativeAmountToWrap = nativeAmountToWrap.add(step.amountIn);
                }
                if (step.useSweep && (0, helper_1.isErc1155Address)(step.tokenOut)) {
                    const { inputs, populateTxData } = this.getSweepCallData({ step, poolGroup, poolIn, poolOut, idIn, idOut });
                    metaDatas.push({
                        code: this.derivableAdr.stateCalHelper,
                        inputs,
                    }, {
                        code: this.derivableAdr.stateCalHelper,
                        inputs: []
                    });
                    promises.push(...populateTxData);
                }
                else {
                    const { inputs, populateTxData } = this.getSwapCallData({ step, poolGroup, poolIn, poolOut, idIn, idOut });
                    metaDatas.push({
                        code: this.derivableAdr.stateCalHelper,
                        inputs,
                    });
                    promises.push(...populateTxData);
                }
            });
            const datas = yield Promise.all(promises);
            const actions = [];
            //@ts-ignore
            metaDatas.forEach((metaData, key) => {
                actions.push(Object.assign(Object.assign({}, metaData), { data: datas[key].data }));
            });
            return { params: [outputs, actions], value: nativeAmountToWrap };
        });
    }
    getSweepCallData({ step, poolGroup, poolIn, poolOut, idIn, idOut }) {
        const stateCalHelper = this.getStateCalHelperContract();
        let inputs = [
            {
                mode: TRANSFER,
                eip: 1155,
                token: this.derivableAdr.token,
                id: (0, helper_1.packId)(idOut + '', poolOut),
                amountIn: step.currentBalanceOut,
                recipient: stateCalHelper.address,
            },
            step.tokenIn === constant_1.NATIVE_ADDRESS ?
                {
                    mode: CALL_VALUE,
                    token: constant_1.ZERO_ADDRESS,
                    eip: 0,
                    id: 0,
                    amountIn: step.amountIn,
                    recipient: constant_1.ZERO_ADDRESS,
                }
                :
                    {
                        mode: PAYMENT,
                        eip: (0, helper_1.isErc1155Address)(step.tokenIn) ? 1155 : 20,
                        token: (0, helper_1.isErc1155Address)(step.tokenIn)
                            ? this.derivableAdr.token
                            : poolGroup.TOKEN_R,
                        id: (0, helper_1.isErc1155Address)(step.tokenIn)
                            ? (0, helper_1.packId)(idIn.toString(), poolIn)
                            : 0,
                        amountIn: step.amountIn,
                        recipient: (0, helper_1.isErc1155Address)(step.tokenIn) ? poolIn : poolOut,
                    },
        ];
        const populateTxData = [
            this.generateSwapParams('swap', {
                sideIn: idIn,
                poolIn: (0, helper_1.isErc1155Address)(step.tokenIn) ? poolIn : poolOut,
                sideOut: idOut,
                poolOut: (0, helper_1.isErc1155Address)(step.tokenOut) ? poolOut : poolIn,
                amountIn: step.payloadAmountIn ? step.payloadAmountIn : step.amountIn,
                maturity: 0,
                payer: this.account,
                recipient: this.account,
                INDEX_R: this.getIndexR(poolGroup.TOKEN_R)
            }),
            stateCalHelper.populateTransaction.sweep((0, helper_1.packId)(idOut + '', poolOut), this.account),
        ];
        return {
            inputs,
            populateTxData
        };
    }
    getSwapCallData({ step, poolGroup, poolIn, poolOut, idIn, idOut }) {
        let inputs = [
            {
                mode: PAYMENT,
                eip: (0, helper_1.isErc1155Address)(step.tokenIn) ? 1155 : 20,
                token: (0, helper_1.isErc1155Address)(step.tokenIn)
                    ? this.derivableAdr.token
                    : step.tokenIn,
                id: (0, helper_1.isErc1155Address)(step.tokenIn)
                    ? (0, helper_1.packId)(idIn.toString(), poolIn)
                    : 0,
                amountIn: step.amountIn,
                recipient: (0, utils_1.isAddress)(step.tokenIn) && this.wrapToken(step.tokenIn) !== poolGroup.TOKEN_R
                    ? this.getUniPool(step.tokenIn, poolGroup.TOKEN_R)
                    : (0, helper_1.isErc1155Address)(step.tokenIn)
                        ? poolIn : poolOut,
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
        const populateTxData = [];
        if ((0, utils_1.isAddress)(step.tokenIn) && this.wrapToken(step.tokenIn) !== poolGroup.TOKEN_R) {
            populateTxData.push(this.generateSwapParams('swapAndOpen', {
                side: idOut,
                deriPool: poolOut,
                uniPool: this.getUniPool(step.tokenIn, poolGroup.TOKEN_R),
                token: step.tokenIn,
                amount: step.payloadAmountIn ? step.payloadAmountIn : step.amountIn,
                payer: this.account,
                recipient: this.account,
                INDEX_R: this.getIndexR(poolGroup.TOKEN_R)
            }));
        }
        else if ((0, utils_1.isAddress)(step.tokenOut) && this.wrapToken(step.tokenOut) !== poolGroup.TOKEN_R) {
            populateTxData.push(this.generateSwapParams('closeAndSwap', {
                side: idIn,
                deriPool: poolIn,
                uniPool: this.getUniPool(step.tokenOut, poolGroup.TOKEN_R),
                token: step.tokenOut,
                amount: step.payloadAmountIn ? step.payloadAmountIn : step.amountIn,
                payer: this.account,
                recipient: this.account,
                INDEX_R: this.getIndexR(poolGroup.TOKEN_R)
            }));
        }
        else {
            populateTxData.push(this.generateSwapParams('swap', {
                sideIn: idIn,
                poolIn: (0, helper_1.isErc1155Address)(step.tokenIn) ? poolIn : poolOut,
                sideOut: idOut,
                poolOut: (0, helper_1.isErc1155Address)(step.tokenOut) ? poolOut : poolIn,
                amountIn: step.payloadAmountIn ? step.payloadAmountIn : step.amountIn,
                maturity: 0,
                payer: this.account,
                recipient: this.account,
                INDEX_R: this.getIndexR(poolGroup.TOKEN_R)
            }));
        }
        return {
            inputs,
            populateTxData
        };
    }
    wrapToken(address) {
        if (address === constant_1.NATIVE_ADDRESS) {
            return this.profile.configs.wrappedTokenAddress;
        }
        return address;
    }
    generateSwapParams(method, params) {
        var _a;
        const stateCalHelper = this.getStateCalHelperContract();
        const functionInterface = (_a = Object.values(stateCalHelper.interface.functions)
            .find((f) => f.name === method)) === null || _a === void 0 ? void 0 : _a.inputs[0].components;
        const formatedParams = {};
        for (let name in params) {
            if (functionInterface === null || functionInterface === void 0 ? void 0 : functionInterface.find((c) => c.name === name)) {
                formatedParams[name] = params[name];
            }
        }
        return stateCalHelper.populateTransaction[method](formatedParams);
    }
    getIdByAddress(address, TOKEN_R) {
        try {
            if ((0, helper_1.isErc1155Address)(address)) {
                return (0, helper_1.bn)(address.split('-')[1]);
            }
            else if (address === TOKEN_R) {
                return (0, helper_1.bn)(constant_1.POOL_IDS.R);
            }
            else if (address === constant_1.NATIVE_ADDRESS &&
                TOKEN_R === this.profile.configs.wrappedTokenAddress) {
                return (0, helper_1.bn)(constant_1.POOL_IDS.native);
            }
            return (0, helper_1.bn)(0);
        }
        catch (e) {
            throw new Error('Token id not found');
        }
    }
    getPoolPoolGroup(addressIn, addressOut) {
        const poolIn = (0, helper_1.isErc1155Address)(addressIn)
            ? this.RESOURCE.pools[addressIn.split('-')[0]]
            : null;
        const poolOut = (0, helper_1.isErc1155Address)(addressOut)
            ? this.RESOURCE.pools[addressOut.split('-')[0]]
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
    getAddressByErc1155Address(address, TOKEN_R) {
        if ((0, helper_1.isErc1155Address)(address)) {
            return address.split('-')[0];
        }
        if (address === constant_1.NATIVE_ADDRESS &&
            TOKEN_R === this.profile.configs.wrappedTokenAddress) {
            return this.profile.configs.wrappedTokenAddress;
        }
        return address;
    }
    getRouterContract(provider) {
        return new ethers_1.ethers.Contract(this.profile.configs.helperContract.utr, this.profile.getAbi('UTR'), provider);
    }
    getStateCalHelperContract(provider) {
        return new ethers_1.ethers.Contract(this.derivableAdr.stateCalHelper, this.profile.getAbi('Helper'), provider || this.provider);
    }
    getIndexR(tokenR) {
        const routeKey = Object.keys(this.profile.routes).find((r) => {
            return [
                ...this.profile.configs.stablecoins.map((stablecoin) => stablecoin + '-' + tokenR),
                ...this.profile.configs.stablecoins.map((stablecoin) => tokenR + '-' + stablecoin)
            ].includes(r);
        });
        const pool = this.profile.routes[routeKey || ''] ? this.profile.routes[routeKey || ''][0] : undefined;
        return (pool === null || pool === void 0 ? void 0 : pool.address) ? (0, helper_1.bn)(ethers_1.ethers.utils.hexZeroPad((0, helper_1.bn)(1).shl(255).add(pool.address).toHexString(), 32)) : (0, helper_1.bn)(0);
    }
    getUniPool(tokenIn, tokenR) {
        const routeKey = Object.keys(this.profile.routes).find((r) => {
            return r === tokenR + '-' + tokenIn || r === tokenIn + '-' + tokenR;
        });
        if (!this.profile.routes[routeKey || ''] || !this.profile.routes[routeKey || ''][0].address) {
            console.error(`Can't find router, please select other token`);
            throw `Can't find router, please select other token`;
        }
        return this.profile.routes[routeKey || ''][0].address;
    }
}
exports.Swap = Swap;
//# sourceMappingURL=swap.js.map