"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const configs_1 = require("./utils/configs");
const providers_1 = require("@ethersproject/providers");
const ethers_1 = require("ethers");
const constant_1 = require("./utils/constant");
const BnA_json_1 = __importDefault(require("./abi/BnA.json"));
const ERC20_json_1 = __importDefault(require("./abi/ERC20.json"));
const TokensInfo_json_1 = __importDefault(require("./abi/TokensInfo.json"));
const Events_json_1 = __importDefault(require("./abi/Events.json"));
const PairDetail_json_1 = __importDefault(require("./abi/PairDetail.json"));
const PairV3Detail_json_1 = __importDefault(require("./abi/PairV3Detail.json"));
const Pool_json_1 = __importDefault(require("./abi/Pool.json"));
const ReserveTokenPrice_json_1 = __importDefault(require("./abi/ReserveTokenPrice.json"));
const Token_json_1 = __importDefault(require("./abi/Token.json"));
const Helper_json_1 = __importDefault(require("./abi/8453/Helper.json"));
const Helper_json_2 = __importDefault(require("./abi/42161/Helper.json"));
const PoolOverride_json_1 = __importDefault(require("./abi/8453/PoolOverride.json"));
const UTR_json_1 = __importDefault(require("./abi/8453/UTR.json"));
const UTROverride_json_1 = __importDefault(require("./abi/8453/UTROverride.json"));
const PoolOverride_json_2 = __importDefault(require("./abi/42161/PoolOverride.json"));
const UTR_json_2 = __importDefault(require("./abi/42161/UTR.json"));
const UTROverride_json_2 = __importDefault(require("./abi/42161/UTROverride.json"));
const abis = {
    BnA: BnA_json_1.default,
    ERC20: ERC20_json_1.default,
    Events: Events_json_1.default,
    PairDetail: PairDetail_json_1.default,
    PairV3Detail: PairV3Detail_json_1.default,
    Pool: Pool_json_1.default,
    ReserveTokenPrice: ReserveTokenPrice_json_1.default,
    Token: Token_json_1.default,
    TokensInfo: TokensInfo_json_1.default,
    8453: {
        Helper: Helper_json_1.default,
        PoolOverride: PoolOverride_json_1.default,
        UTR: UTR_json_1.default,
        UTROverride: UTROverride_json_1.default,
    },
    42161: {
        Helper: Helper_json_2.default,
        PoolOverride: PoolOverride_json_2.default,
        UTR: UTR_json_2.default,
        UTROverride: UTROverride_json_2.default,
    },
};
class Profile {
    constructor(chainId, configs) {
        this.chainId = chainId;
        this.configs = this.loadConfig(configs, chainId);
    }
    loadConfig(configProp, chainIdProp) {
        const defaultConfig = configs_1.CONFIGS[chainIdProp];
        const config = Object.assign(Object.assign(Object.assign({}, defaultConfig), configProp), { addresses: Object.assign(Object.assign({}, defaultConfig.addresses), configProp.addresses) });
        // const config = mergeDeep(this.loadDefaultConfig(chainIdProp), configProp)
        const overrideProvider = new providers_1.JsonRpcProvider(config.rpcUrl);
        const provider = new ethers_1.ethers.providers.JsonRpcProvider(config.rpcUrl);
        const providerToGetLog = new ethers_1.ethers.providers.JsonRpcProvider(config.rpcToGetLogs);
        return Object.assign(Object.assign({}, config), { overrideProvider,
            provider,
            providerToGetLog });
    }
    getAbi(name) {
        return abis[name] ? abis[name] : (abis[this.chainId][name] || []);
    }
    getEventDataAbi() {
        return constant_1.EventDataAbis[this.chainId];
    }
}
exports.Profile = Profile;
//# sourceMappingURL=profile.js.map