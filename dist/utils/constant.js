"use strict";
exports.__esModule = true;
exports.POOL_IDS = exports.ddlGenesisBlock = exports.LOCALSTORAGE_KEY = exports.CHART_API_ENDPOINT = exports.TIME_TO_REFRESH_STATE = exports.LP_PRICE_UNIT = exports.MINI_SECOND_PER_DAY = exports.fee10000 = exports.ZERO_ADDRESS = exports.LARGE_VALUE = void 0;
exports.LARGE_VALUE = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
exports.ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
exports.fee10000 = 30;
exports.MINI_SECOND_PER_DAY = 86400000;
exports.LP_PRICE_UNIT = 10000;
exports.TIME_TO_REFRESH_STATE = 30000;
exports.CHART_API_ENDPOINT = 'https://api.lz.finance/56/chart/';
exports.LOCALSTORAGE_KEY = {
    DDL_LOGS: 'ddl-log-v1.0',
    LAST_BLOCK_DDL_LOGS: 'last-block-ddl-log-v1.0',
    SWAP_LOGS: 'swap-log-v1.0',
    SWAP_BLOCK_LOGS: 'last-block-swap-log-v1.0'
};
exports.ddlGenesisBlock = {
    56: 23917200
};
exports.POOL_IDS = {
    cToken: 131072,
    cp: 65536,
    token0: 262144,
    token1: 262145,
    native: '0x000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
};
//# sourceMappingURL=constant.js.map