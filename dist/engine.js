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
const providers_1 = require("@ethersproject/providers");
class Engine {
    constructor(configs) {
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.rpcUrl = configs.rpcUrl;
        this.overrideProvider = new providers_1.JsonRpcProvider('HTTP://0.0.0.0:8545');
        this.storage = configs.storage;
        this.provider = configs.provider;
        this.account = configs.account;
        this.signer = configs.signer;
        this.providerToGetLog = configs.providerToGetLog;
        this.initServices();
    }
    initServices() {
        this.UNIV2PAIR = new uniV2Pair_1.UniV2Pair({
            chainId: this.chainId,
            scanApi: this.scanApi,
            provider: this.provider
        });
        this.BNA = new balanceAndAllowance_1.BnA({
            account: this.account,
            chainId: this.chainId,
            provider: this.provider,
        });
        this.RESOURCE = new resource_1.Resource({
            account: this.account,
            chainId: this.chainId,
            scanApi: this.scanApi,
            storage: this.storage,
            provider: this.provider,
            providerToGetLog: this.providerToGetLog,
            UNIV2PAIR: this.UNIV2PAIR,
            overrideProvider: this.overrideProvider,
        });
        this.PRICE = new price_1.Price({
            chainId: this.chainId,
            scanApi: this.scanApi,
            provider: this.provider,
            providerToGetLog: this.providerToGetLog,
            UNIV2PAIR: this.UNIV2PAIR
        });
        this.CURRENT_POOL = new currentPool_1.CurrentPool({
            chainId: this.chainId,
            resource: this.RESOURCE,
            poolAddress: this.currentPoolAddress
        });
        this.HISTORY = new history_1.History({
            account: this.account,
            CURRENT_POOL: this.CURRENT_POOL,
        });
        this.SWAP = new swap_1.Swap({
            chainId: this.chainId,
            provider: this.provider,
            scanApi: this.scanApi,
            UNIV2PAIR: this.UNIV2PAIR,
            CURRENT_POOL: this.CURRENT_POOL,
            signer: this.signer,
            account: this.account,
            overrideProvider: this.overrideProvider
        });
        this.CREATE_POOL = new createPool_1.CreatePool({
            chainId: this.chainId,
            provider: this.provider,
            scanApi: this.scanApi,
            UNIV2PAIR: this.UNIV2PAIR,
            signer: this.signer,
            account: this.account,
            overrideProvider: this.overrideProvider
        });
    }
    setCurrentPool(poolData) {
        this.CURRENT_POOL.initCurrentPoolData(poolData);
    }
}
exports.Engine = Engine;
//# sourceMappingURL=engine.js.map