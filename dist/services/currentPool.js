"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentPool = void 0;
const configs_1 = require("../utils/configs");
const helper_1 = require("../utils/helper");
const constant_1 = require("../utils/constant");
class CurrentPool {
    constructor(configs) {
        this.resource = configs.resource;
        this.poolAddress = configs.poolAddress;
        this.chainId = configs.chainId;
        // this.loadState(configs.poolAddress)
    }
    setPoolAddress(address) {
        this.poolAddress = address;
        // this.loadState(address)
    }
    // loadState(poolAddress: string) {
    //   if (poolAddress && !this.resource.pools[poolAddress]) {
    //     this.resource.fetchResourceData('')
    //   } else if (poolAddress && this.resource.pools[poolAddress]) {
    //     this.initCurrentPoolData(poolAddress)
    //   }
    // }
    initCurrentPoolData(poolData) {
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
    }
    getTokenByPower(power) {
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
        const index = this.powers.findIndex((p) => p === Number(power));
        return this.dTokens[index];
    }
    getIdByAddress(address) {
        try {
            if (address === this.baseToken)
                return (0, helper_1.bn)(this.baseId);
            if (address === this.quoteToken)
                return (0, helper_1.bn)(this.quoteId);
            if (address === configs_1.CONFIGS[this.chainId].nativeToken)
                return (0, helper_1.bn)(constant_1.POOL_IDS.native);
            if (address === this.cToken)
                return (0, helper_1.bn)(constant_1.POOL_IDS.cToken);
            return (0, helper_1.bn)(address.split('-')[1]);
        }
        catch (e) {
            throw new Error('Token id not found:' + address);
        }
    }
}
exports.CurrentPool = CurrentPool;
//# sourceMappingURL=currentPool.js.map