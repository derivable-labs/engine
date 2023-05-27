"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engine = void 0;
const price_1 = require("./services/price");
const resource_1 = require("./services/resource");
const balanceAndAllowance_1 = require("./services/balanceAndAllowance");
const uniV2Pair_1 = require("./services/uniV2Pair");
const history_1 = require("./services/history");
const swap_1 = require("./services/swap");
const currentPool_1 = require("./services/currentPool");
const createPool_1 = require("./services/createPool");
const uniV3Pair_1 = require("./services/uniV3Pair");
const setConfig_1 = require("./services/setConfig");
const configs_1 = require("./utils/configs");
// type ConfigType = {
//   chainId: number
//   scanApi: string
//   rpcUrl: string
//   signer?: ethers.providers.JsonRpcSigner
//   provider: ethers.providers.Provider
//   providerToGetLog: ethers.providers.Provider
//   account?: string
//   storage?: Storage
// }
class Engine {
    constructor(account, config, chainIdProp = configs_1.DEFAULT_CHAIN) {
        this.config = setConfig_1.Derivable.loadConfig(account, config, chainIdProp);
        this.chainId = this.config.chainId;
        this.scanApi = this.config.scanApi;
        this.rpcUrl = this.config.rpcUrl;
        this.storage = this.config.storage;
        this.overrideProvider = this.config.overrideProvider;
        this.provider = this.config.provider;
        this.account = account;
        this.signer = this.config.signer;
        this.providerToGetLog = this.config.providerToGetLog;
        this.initServices();
    }
    initServices() {
        this.UNIV2PAIR = new uniV2Pair_1.UniV2Pair(this.config);
        this.UNIV3PAIR = new uniV3Pair_1.UniV3Pair(this.config);
        this.BNA = new balanceAndAllowance_1.BnA(this.config);
        this.RESOURCE = new resource_1.Resource(this.config);
        this.PRICE = new price_1.Price(this.config);
        this.CURRENT_POOL = new currentPool_1.CurrentPool(this.config);
        this.HISTORY = new history_1.History(Object.assign(Object.assign({}, this.config), { CURRENT_POOL: this.CURRENT_POOL }));
        this.SWAP = new swap_1.Swap(Object.assign(Object.assign({}, this.config), { CURRENT_POOL: this.CURRENT_POOL }));
        this.CREATE_POOL = new createPool_1.CreatePool(this.config);
    }
    setCurrentPool(poolData) {
        this.CURRENT_POOL.initCurrentPoolData(poolData);
    }
}
exports.Engine = Engine;
//# sourceMappingURL=engine.js.map