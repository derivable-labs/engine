"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentPool = void 0;
var configs_1 = require("../utils/configs");
var CurrentPool = /** @class */ (function () {
    function CurrentPool(configs) {
        this.resource = configs.resource;
        this.poolAddress = configs.poolAddress;
        this.chainId = configs.chainId;
        // this.loadState(configs.poolAddress)
    }
    CurrentPool.prototype.setPoolAddress = function (address) {
        this.poolAddress = address;
        // this.loadState(address)
    };
    // loadState(poolAddress: string) {
    //   if (poolAddress && !this.resource.pools[poolAddress]) {
    //     this.resource.fetchResourceData('')
    //   } else if (poolAddress && this.resource.pools[poolAddress]) {
    //     this.initCurrentPoolData(poolAddress)
    //   }
    // }
    CurrentPool.prototype.initCurrentPoolData = function (poolData) {
        this.poolAddress = poolData.poolAddress;
        this.baseToken = poolData.baseToken;
        this.quoteToken = poolData.quoteToken;
        this.cToken = poolData.cToken;
        this.dTokens = poolData.dTokens;
        this.logicAddress = poolData.logic;
        this.cTokenPrice = poolData.cTokenPrice;
        this.states = poolData.states;
        this.powers = poolData.powers;
        this.basePrice = poolData.basePrice;
        this.baseId = poolData.baseId;
        this.quoteId = poolData.quoteId;
    };
    CurrentPool.prototype.getTokenByPower = function (power) {
        if (power === 'C') {
            return this.cToken;
        }
        else if (power === 'B') {
            return this.baseToken;
        }
        else if (power === 'Q') {
            return this.quoteToken;
        }
        else if (power === 'N') { // native token
            return configs_1.CONFIGS[this.chainId].nativeToken;
        }
        var index = this.powers.findIndex(function (p) { return p === Number(power); });
        return this.dTokens[index];
    };
    return CurrentPool;
}());
exports.CurrentPool = CurrentPool;
//# sourceMappingURL=currentPool.js.map