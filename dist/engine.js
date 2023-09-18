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
const profile_1 = require("./profile");
class Engine {
    constructor(enginConfigs, profile = profile_1.Profile) {
        this.enginConfigs = enginConfigs;
        this.account = enginConfigs.account;
        // this.providerToGetLog = this.config.providerToGetLog
        this.profile = new profile(enginConfigs);
    }
    initServices() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.profile.loadConfig();
            this.UNIV2PAIR = new uniV2Pair_1.UniV2Pair(this.enginConfigs, this.profile);
            this.UNIV3PAIR = new uniV3Pair_1.UniV3Pair(this.enginConfigs, this.profile);
            this.BNA = new balanceAndAllowance_1.BnA(this.enginConfigs, this.profile);
            this.RESOURCE = new resource_1.Resource(this.enginConfigs, this.profile);
            this.PRICE = new price_1.Price(this.enginConfigs, this.profile);
            this.CURRENT_POOL = new currentPool_1.CurrentPool(this.enginConfigs);
            this.HISTORY = new history_1.History(Object.assign(Object.assign({}, this.enginConfigs), { CURRENT_POOL: this.CURRENT_POOL }), this.profile);
            this.SWAP = new swap_1.Swap(Object.assign(Object.assign({}, this.enginConfigs), { CURRENT_POOL: this.CURRENT_POOL }), this.profile);
            this.CREATE_POOL = new createPool_1.CreatePool(this.enginConfigs, this.profile);
        });
    }
    setCurrentPool(poolData) {
        this.CURRENT_POOL.initCurrentPoolData(poolData);
    }
}
exports.Engine = Engine;
//# sourceMappingURL=engine.js.map