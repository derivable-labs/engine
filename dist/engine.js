"use strict";
exports.__esModule = true;
exports.Engine = void 0;
var price_1 = require("./services/price");
var resource_1 = require("./services/resource");
var balanceAndAllowance_1 = require("./services/balanceAndAllowance");
var uniV2Pair_1 = require("./services/uniV2Pair");
var history_1 = require("./services/history");
var swap_1 = require("./services/swap");
var currentPool_1 = require("./services/currentPool");
var Engine = /** @class */ (function () {
    function Engine(configs) {
        this.chainId = configs.chainId;
        this.scanApi = configs.scanApi;
        this.rpcUrl = configs.rpcUrl;
        this.storage = configs.storage;
        this.provider = configs.provider;
        this.account = configs.account;
        this.signer = configs.signer;
        this.providerToGetLog = configs.providerToGetLog;
        this.initServices();
    }
    Engine.prototype.initServices = function () {
        this.UNIV2PAIR = new uniV2Pair_1.UniV2Pair({
            chainId: this.chainId,
            scanApi: this.scanApi,
            provider: this.provider
        });
        this.BNA = new balanceAndAllowance_1.BnA({
            account: this.account,
            chainId: this.chainId,
            provider: this.provider
        });
        this.RESOURCE = new resource_1.Resource({
            account: this.account,
            chainId: this.chainId,
            scanApi: this.scanApi,
            storage: this.storage,
            provider: this.provider,
            providerToGetLog: this.providerToGetLog,
            UNIV2PAIR: this.UNIV2PAIR
        });
        this.PRICE = new price_1.Price({
            chainId: this.chainId,
            scanApi: this.scanApi,
            provider: this.provider,
            providerToGetLog: this.providerToGetLog,
            UNIV2PAIR: this.UNIV2PAIR
        });
        this.HISTORY = new history_1.History();
        this.CURRENT_POOL = new currentPool_1.CurrentPool({
            chainId: this.chainId,
            resource: this.RESOURCE,
            poolAddress: this.currentPoolAddress
        });
        this.SWAP = new swap_1.Swap({
            chainId: this.chainId,
            provider: this.provider,
            scanApi: this.scanApi,
            UNIV2PAIR: this.UNIV2PAIR,
            CURRENT_POOL: this.CURRENT_POOL,
            signer: this.signer,
            account: this.account
        });
    };
    Engine.prototype.setCurrentPool = function (poolData) {
        this.CURRENT_POOL.initCurrentPoolData(poolData);
    };
    return Engine;
}());
exports.Engine = Engine;
//# sourceMappingURL=engine.js.map