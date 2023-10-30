"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Swap = void 0;
const ethers_1 = require("ethers");
const helper_1 = require("../utils/helper");
const constant_1 = require("../utils/constant");
const providers_1 = require("@ethersproject/providers");
const utils_1 = require("ethers/lib/utils");
const OracleSdkAdapter = __importStar(require("../utils/OracleSdkAdapter"));
const OracleSdk = __importStar(require("../utils/OracleSdk"));
const PAYMENT = 0;
const TRANSFER = 1;
const CALL_VALUE = 2;
class Swap {
    constructor(config, profile) {
        this.config = config;
        this.account = config.account;
        this.chainId = config.chainId;
        this.scanApi = profile.configs.scanApi;
        this.provider = new ethers_1.ethers.providers.JsonRpcProvider(profile.configs.rpc);
        this.overrideProvider = new providers_1.JsonRpcProvider(profile.configs.rpc);
        this.providerGetProof = new providers_1.JsonRpcProvider(profile.configs.rpcGetProof || profile.configs.rpc);
        this.signer = config.signer;
        this.RESOURCE = config.RESOURCE;
        this.profile = profile;
        this.derivableAdr = profile.configs.derivable;
    }
    async calculateAmountOuts(steps, fetcherV2 = false) {
        if (!this.signer)
            return [[(0, helper_1.bn)(0)], (0, helper_1.bn)(0)];
        try {
            const { helperContract, gasLimitDefault, gasForProof } = this.profile.configs;
            const stepsToSwap = [...steps].map((step) => {
                return { ...step, amountOutMin: 0 };
            });
            const { params, value } = await this.convertStepToActions(stepsToSwap, fetcherV2, true);
            const router = helperContract.utr;
            const contract = new ethers_1.ethers.Contract(router, this.profile.getAbi('UTROverride').abi, this.getOverrideProvider());
            const res = await contract.callStatic.exec(...params, {
                from: this.account,
                value,
                gasLimit: gasLimitDefault,
            });
            const result = [];
            for (const i in steps) {
                result.push({ ...steps[i], amountOut: res[0][i] });
            }
            let gasUsed = gasLimitDefault - res.gasLeft.toNumber();
            if (fetcherV2) {
                gasUsed += gasForProof ?? 800000;
            }
            return [result, (0, helper_1.bn)(gasUsed)];
        }
        catch (e) {
            if (e?.reason === "OLD" && !fetcherV2) {
                return this.calculateAmountOuts(steps, true);
            }
            throw e;
        }
    }
    async callStaticMultiSwap({ params, value, gasLimit }) {
        const contract = this.getRouterContract(this.signer);
        return await contract.callStatic.exec(...params, {
            value: value || (0, helper_1.bn)(0),
            gasLimit: gasLimit || undefined,
        });
    }
    async convertStepToActions(steps, submitFetcherV2, isCalculate = false) {
        // @ts-ignore
        const stateCalHelper = this.getStateCalHelperContract();
        let outputs = [];
        steps.forEach((step) => {
            const poolGroup = this.getPoolPoolGroup(step.tokenIn, step.tokenOut);
            outputs.push({
                recipient: this.account,
                eip: (0, helper_1.isErc1155Address)(step.tokenOut) ? 1155 : step.tokenOut === constant_1.NATIVE_ADDRESS ? 0 : 20,
                token: (0, helper_1.isErc1155Address)(step.tokenOut) ? this.derivableAdr.token : step.tokenOut,
                id: (0, helper_1.isErc1155Address)(step.tokenOut)
                    ? (0, helper_1.packId)(this.getIdByAddress(step.tokenOut, poolGroup.TOKEN_R).toString(), this.getAddressByErc1155Address(step.tokenOut, poolGroup.TOKEN_R))
                    : (0, helper_1.bn)(0),
                amountOutMin: step.amountOutMin,
            });
        });
        let nativeAmountToWrap = (0, helper_1.bn)(0);
        const metaDatas = [];
        const promises = [];
        const fetcherData = {};
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
                    inputs: [],
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
            if (submitFetcherV2) {
                const pool = (0, helper_1.isErc1155Address)(step.tokenIn) ? this.RESOURCE.pools[poolIn] : this.RESOURCE.pools[poolOut];
                promises.push(isCalculate ? this.fetchPriceMockTx(pool) : this.fetchPriceTx(pool));
            }
        });
        const datas = await Promise.all(promises);
        const actions = [];
        //@ts-ignore
        metaDatas.forEach((metaData, key) => {
            actions.push({ ...metaData, data: datas[key].data });
        });
        if (submitFetcherV2) {
            // data in last of `datas` is submitFetchV2 data
            for (let i = metaDatas.length; i < datas.length; i++) {
                actions.unshift(datas[datas.length - 1]);
            }
        }
        return { params: [outputs, actions], value: nativeAmountToWrap };
    }
    getSweepCallData({ step, poolGroup, poolIn, poolOut, idIn, idOut, }) {
        const stateCalHelper = this.getStateCalHelperContract();
        const swapCallData = this.getSwapCallData({ step, poolGroup, poolIn, poolOut, idIn, idOut });
        let inputs = [
            {
                mode: TRANSFER,
                eip: 1155,
                token: this.derivableAdr.token,
                id: (0, helper_1.packId)(idOut + '', poolOut),
                amountIn: step.currentBalanceOut,
                recipient: stateCalHelper.address,
            },
            ...swapCallData.inputs,
        ];
        const populateTxData = [
            ...swapCallData.populateTxData,
            stateCalHelper.populateTransaction.sweep((0, helper_1.packId)(idOut + '', poolOut), this.account),
        ];
        return {
            inputs,
            populateTxData,
        };
    }
    getSwapCallData({ step, poolGroup, poolIn, poolOut, idIn, idOut, }) {
        let inputs = [
            {
                mode: PAYMENT,
                eip: (0, helper_1.isErc1155Address)(step.tokenIn) ? 1155 : 20,
                token: (0, helper_1.isErc1155Address)(step.tokenIn) ? this.derivableAdr.token : step.tokenIn,
                id: (0, helper_1.isErc1155Address)(step.tokenIn) ? (0, helper_1.packId)(idIn.toString(), poolIn) : 0,
                amountIn: step.amountIn,
                recipient: (0, utils_1.isAddress)(step.tokenIn) && this.wrapToken(step.tokenIn) !== poolGroup.TOKEN_R
                    ? this.getUniPool(step.tokenIn, poolGroup.TOKEN_R)
                    : (0, helper_1.isErc1155Address)(step.tokenIn)
                        ? poolIn
                        : poolOut,
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
                INDEX_R: this.getIndexR(poolGroup.TOKEN_R),
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
                INDEX_R: this.getIndexR(poolGroup.TOKEN_R),
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
                INDEX_R: this.getIndexR(poolGroup.TOKEN_R),
            }));
        }
        return {
            inputs,
            populateTxData,
        };
    }
    wrapToken(address) {
        if (address === constant_1.NATIVE_ADDRESS) {
            return this.profile.configs.wrappedTokenAddress;
        }
        return address;
    }
    generateSwapParams(method, params) {
        const stateCalHelper = this.getStateCalHelperContract();
        const functionInterface = Object.values(stateCalHelper.interface.functions).find((f) => f.name === method)?.inputs[0].components;
        const formatedParams = {};
        for (let name in params) {
            if (functionInterface?.find((c) => c.name === name)) {
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
            else if (address === constant_1.NATIVE_ADDRESS && TOKEN_R === this.profile.configs.wrappedTokenAddress) {
                return (0, helper_1.bn)(constant_1.POOL_IDS.native);
            }
            return (0, helper_1.bn)(0);
        }
        catch (e) {
            throw new Error('Token id not found');
        }
    }
    getPoolPoolGroup(addressIn, addressOut) {
        const poolIn = (0, helper_1.isErc1155Address)(addressIn) ? this.RESOURCE.pools[addressIn.split('-')[0]] : null;
        const poolOut = (0, helper_1.isErc1155Address)(addressOut) ? this.RESOURCE.pools[addressOut.split('-')[0]] : null;
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
    async multiSwap(steps, { gasLimit, gasPrice, submitFetcherV2 = false, onSubmitted }) {
        try {
            const { params, value } = await this.convertStepToActions([...steps], submitFetcherV2);
            await this.callStaticMultiSwap({
                params,
                value,
                gasLimit,
                gasPrice: gasPrice || undefined
            });
            const contract = this.getRouterContract(this.signer);
            const res = await contract.exec(...params, {
                value,
                gasLimit: gasLimit || undefined,
                gasPrice: gasPrice || undefined
            });
            if (onSubmitted) {
                onSubmitted({ hash: res.hash, steps });
            }
            const tx = await res.wait(1);
            console.log('tx', tx);
            return tx;
        }
        catch (e) {
            if (e?.reason === "OLD" && !submitFetcherV2) {
                return this.multiSwap(steps, { gasLimit, gasPrice, submitFetcherV2: true, onSubmitted });
            }
            throw e;
        }
    }
    getAddressByErc1155Address(address, TOKEN_R) {
        if ((0, helper_1.isErc1155Address)(address)) {
            return address.split('-')[0];
        }
        if (address === constant_1.NATIVE_ADDRESS && TOKEN_R === this.profile.configs.wrappedTokenAddress) {
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
                ...this.profile.configs.stablecoins.map((stablecoin) => tokenR + '-' + stablecoin),
            ].includes(r);
        });
        const pool = this.profile.routes[routeKey || ''] ? this.profile.routes[routeKey || ''][0] : undefined;
        return pool?.address ? (0, helper_1.bn)(ethers_1.ethers.utils.hexZeroPad((0, helper_1.bn)(1).shl(255).add(pool.address).toHexString(), 32)) : (0, helper_1.bn)(0);
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
    async fetchPriceTx(pool, blockNumber) {
        if (blockNumber == null) {
            blockNumber = await this.provider.getBlockNumber();
        }
        const getProof = OracleSdkAdapter.getProofFactory(this.providerGetProof);
        const getBlockByNumber = OracleSdkAdapter.getBlockByNumberFactory(this.overrideProvider);
        // get the proof from the SDK
        const proof = await OracleSdk.getProof(getProof, getBlockByNumber, pool.pair, pool.quoteTokenIndex, (0, helper_1.bn)(blockNumber).sub(pool.window.toNumber() >> 1).toNumber());
        // Connect to the network
        const contractWithSigner = new ethers_1.Contract(pool.FETCHER, this.profile.getAbi('FetcherV2'), this.signer);
        const data = await contractWithSigner.populateTransaction.submit(pool.ORACLE, proof);
        return {
            inputs: [],
            code: pool.FETCHER,
            data: data.data,
        };
    }
    async fetchPriceMockTx(pool, blockNumber) {
        if (blockNumber == null) {
            blockNumber = await this.provider.getBlockNumber();
        }
        const targetBlock = (0, helper_1.bn)(blockNumber).sub(pool.window.toNumber() >> 1);
        const getStorageAt = OracleSdkAdapter.getStorageAtFactory(this.overrideProvider);
        const accumulator = await OracleSdk.getAccumulatorPrice(getStorageAt, pool.pair, pool.quoteTokenIndex, targetBlock.toNumber());
        // Connect to the network
        const contractWithSigner = new ethers_1.Contract(pool.FETCHER, this.profile.getAbi('FetcherV2Mock').abi, this.signer);
        const data = await contractWithSigner.populateTransaction.submitPrice(pool.ORACLE, (0, helper_1.bn)(accumulator.price), targetBlock, accumulator.timestamp);
        return {
            inputs: [],
            code: pool.FETCHER,
            data: data.data,
        };
    }
    getOverrideProvider() {
        const router = this.profile.configs.helperContract.utr;
        const fetcherV2 = this.profile.configs.derivable.uniswapV2Fetcher;
        this.overrideProvider.setStateOverride({
            [router]: {
                code: this.profile.getAbi('UTROverride').deployedBytecode,
            },
            ...(fetcherV2 ? {
                [fetcherV2]: {
                    code: this.profile.getAbi('FetcherV2Mock').deployedBytecode,
                }
            } : {})
        });
        return this.overrideProvider;
    }
}
exports.Swap = Swap;
//# sourceMappingURL=swap.js.map