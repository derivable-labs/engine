"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Derivable = void 0;
const ethers_1 = require("ethers");
const providers_1 = require("@ethersproject/providers");
const configs_1 = require("../utils/configs");
class Derivable {
    static loadConfig(account, configProp, chainIdProp) {
        const defaultConfig = this.loadDefaultConfig(chainIdProp);
        const config = Object.assign(Object.assign(Object.assign({}, defaultConfig), configProp), { addresses: Object.assign(Object.assign({}, defaultConfig.addresses), configProp.addresses) });
        // const config = mergeDeep(this.loadDefaultConfig(chainIdProp), configProp)
        const overrideProvider = new providers_1.JsonRpcProvider(config.rpcUrl);
        const provider = new ethers_1.ethers.providers.JsonRpcProvider(config.rpcUrl);
        const providerToGetLog = new ethers_1.ethers.providers.JsonRpcProvider(config.rpcToGetLogs);
        return Object.assign(Object.assign({}, config), { account,
            overrideProvider,
            provider,
            providerToGetLog });
    }
    static loadContract(config = configs_1.DEFAULT_CONFIG, chainIdProp) {
        if (chainIdProp) {
            config = this.loadDefaultConfig(chainIdProp);
        }
        const token = config.addresses.token;
        const multiCall = config.addresses.multiCall;
        const pairsInfo = config.addresses.pairsInfo;
        const pairsV3Info = config.addresses.pairsV3Info;
        const bnA = config.addresses.bnA;
        const tokensInfo = config.addresses.tokensInfo;
        const router = config.addresses.router;
        const wrapToken = config.addresses.wrapToken;
        const wrapUsdPair = config.addresses.wrapUsdPair;
        const poolFactory = config.addresses.poolFactory;
        const stateCalHelper = config.addresses.stateCalHelper;
        const logic = config.addresses.logic;
        const reserveTokenPrice = config.addresses.reserveTokenPrice;
        const uniswapFactory = config.addresses.uniswapFactory;
        return {
            token,
            multiCall,
            pairsInfo,
            pairsV3Info,
            bnA,
            tokensInfo,
            router,
            wrapToken,
            wrapUsdPair,
            poolFactory,
            stateCalHelper,
            logic,
            reserveTokenPrice,
            uniswapFactory,
        };
    }
    // static setConfig(account: string, config = DEFAULT_CONFIG): Engine {
    //   const engine = new Engine(account, config)
    //   return engine
    // }
    static loadDefaultConfig(chainId) {
        switch (chainId) {
            case 56:
                return configs_1.BNB_CONFIG;
            case 1337:
                return configs_1.TESTNET_CONFIG;
            case 42161:
                return configs_1.ARBITRUM_CONFIG;
            case 8453:
                return configs_1.BASE_CONFIG;
            default:
                return configs_1.ARBITRUM_CONFIG;
        }
    }
}
exports.Derivable = Derivable;
//# sourceMappingURL=setConfig.js.map