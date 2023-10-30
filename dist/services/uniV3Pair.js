"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniV3Pair = void 0;
const ethers_1 = require("ethers");
const PairV3Detail_json_1 = __importDefault(require("../abi/PairV3Detail.json"));
const UniswapV3Factory_json_1 = __importDefault(require("../abi/UniswapV3Factory.json"));
const ERC20_json_1 = __importDefault(require("../abi/ERC20.json"));
const providers_1 = require("@ethersproject/providers");
const ethereum_multicall_1 = require("ethereum-multicall");
const constant_1 = require("../utils/constant");
const helper_1 = require("../utils/helper");
const POOL_FEES = [100, 300, 500];
const FLAG = '0x0000110000000000000000000000000000000000000000000000000000000111';
class UniV3Pair {
    constructor(config, profile) {
        const pairsV3Info = '0x' + PairV3Detail_json_1.default.deployedBytecode.slice(-40);
        this.chainId = config.chainId;
        this.scanApi = profile.configs.scanApi;
        this.provider = new providers_1.JsonRpcProvider(profile.configs.rpc);
        this.rpcUrl = profile.configs.rpc;
        this.pairsV3Info = pairsV3Info;
        this.profile = profile;
    }
    async getLargestPoolAddress({ baseToken, quoteTokens }) {
        const pools = await this.getPairAddress({ baseToken, quoteTokens });
        return await this._getLargestPoolByPools(baseToken, pools);
    }
    /**
     *
     * @param baseToken
     * @param pools
     * poolsType: {
     *   [`${baseAddress-quoteAddress-fee}`]: poolAddress
     * }
     */
    async _getLargestPoolByPools(baseToken, pools) {
        const multicall = this._getMulticall();
        const res = await multicall.call(this._generatePoolBalanceContext(baseToken, pools));
        return this._parsePoolBalanceReturnContext(res.results.poolBalances.callsReturnContext);
    }
    _parsePoolBalanceReturnContext(returnContexts) {
        let poolResults = constant_1.ZERO_ADDRESS;
        let max = (0, helper_1.bn)(0);
        returnContexts.forEach((returnContext) => {
            if ((0, helper_1.bn)(returnContext.returnValues[0].hex).gt(max)) {
                poolResults = returnContext.reference;
                max = (0, helper_1.bn)(returnContext.returnValues[0].hex);
            }
        });
        return poolResults;
    }
    _generatePoolBalanceContext(baseToken, pools) {
        const calls = [];
        for (let i in pools) {
            calls.push({
                reference: pools[i],
                methodName: 'balanceOf',
                methodParameters: [pools[i]],
            });
        }
        return [
            {
                reference: 'poolBalances',
                contractAddress: baseToken,
                abi: ERC20_json_1.default,
                calls,
            },
        ];
    }
    async getPairAddress({ baseToken, quoteTokens }) {
        const multicall = this._getMulticall();
        //@ts-ignore
        const context = this._generatePoolAddressContext(baseToken, quoteTokens);
        const res = await multicall.call(context);
        return this._parsePoolAddressReturnContext(res.results.poolAddresses['callsReturnContext']);
    }
    _parsePoolAddressReturnContext(returnContexts) {
        const results = {};
        returnContexts.forEach((returnContext) => {
            if (returnContext.returnValues[0] !== constant_1.ZERO_ADDRESS) {
                results[returnContext.reference] = returnContext.returnValues[0];
            }
        });
        return results;
    }
    _generatePoolAddressContext(baseToken, quoteTokens) {
        const calls = [];
        POOL_FEES.forEach((fee) => {
            quoteTokens.forEach((quoteToken) => {
                calls.push({
                    reference: `${baseToken}-${quoteToken}-${fee}`,
                    methodName: 'getPool',
                    methodParameters: [baseToken, quoteToken, fee],
                });
            });
        });
        return [
            {
                reference: 'poolAddresses',
                contractAddress: this.profile.configs.uniswap.v3Factory,
                abi: UniswapV3Factory_json_1.default,
                calls,
            },
        ];
    }
    async getPairInfo({ pairAddress, flag = FLAG }) {
        try {
            const provider = new providers_1.JsonRpcProvider(this.rpcUrl);
            // @ts-ignore
            provider.setStateOverride({
                [this.pairsV3Info]: {
                    code: PairV3Detail_json_1.default.deployedBytecode,
                },
            });
            const pairDetailContract = new ethers_1.ethers.Contract(this.pairsV3Info, PairV3Detail_json_1.default.abi, provider);
            const res = await pairDetailContract.functions.query([pairAddress], flag);
            return res.details[0];
        }
        catch (e) {
            throw e;
        }
    }
    async getPairsInfo({ pairAddresses, flag = FLAG }) {
        try {
            const provider = new providers_1.JsonRpcProvider(this.rpcUrl);
            // @ts-ignore
            provider.setStateOverride({
                [this.pairsV3Info]: {
                    code: PairV3Detail_json_1.default.deployedBytecode,
                },
            });
            const pairDetailContract = new ethers_1.ethers.Contract(this.pairsV3Info, PairV3Detail_json_1.default.abi, provider);
            const { details } = await pairDetailContract.functions.query(pairAddresses, flag);
            const result = {};
            for (let i = 0; i < pairAddresses.length; i++) {
                result[pairAddresses[i]] = {
                    token0: {
                        address: details[i].token0.adr,
                        name: details[i].token0.name,
                        symbol: details[i].token0.symbol,
                        decimal: details[i].token0.decimals.toNumber(),
                        reserve: details[i].token0.reserve,
                    },
                    token1: {
                        address: details[i].token1.adr,
                        name: details[i].token1.name,
                        symbol: details[i].token1.symbol,
                        decimal: details[i].token1.decimals.toNumber(),
                        reserve: details[i].token1.reserve
                    },
                };
            }
            return result;
        }
        catch (e) {
            throw e;
        }
    }
    _getMulticall() {
        return new ethereum_multicall_1.Multicall({
            multicallCustomContractAddress: this.profile.configs.helperContract.multiCall,
            ethersProvider: this.provider,
            tryAggregate: true,
        });
    }
}
exports.UniV3Pair = UniV3Pair;
//# sourceMappingURL=uniV3Pair.js.map