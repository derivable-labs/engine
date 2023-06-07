"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CHAIN = exports.DEFAULT_CONFIG = exports.ARBITRUM_CONFIG = exports.BNB_CONFIG = exports.TESTNET_CONFIG = void 0;
exports.TESTNET_CONFIG = {
    chainId: 1337,
    rpcUrl: 'http://localhost:8545',
    rpcToGetLogs: 'http://localhost:8545',
    timePerBlock: 3000,
    nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    addresses: {
        reserveTokenPrice: '0x0000000000000000000000000000000000000001',
        uniswapFactory: '0x2B528278eEEf8d30838fCC6297e6f28D4F03b1BD',
        token: '0x7094BFd0db1b11Dd677831d4f9eB81bb15348c21',
        multiCall: '0x0748990Cd23F13545805295eD1aED30D9f335984',
        pairsInfo: '0x2bdcF38cd1cb4db04ac6604ECaa02C2fbf1e13e2',
        pairsV3Info: '0x7AF7e1669Af4c76B566BFeC7AB722ba6dE0719A3',
        bnA: '0xa3030Cef13eFd3E625c576A622E6123Cf7B4006d',
        tokensInfo: '0x3DC842B4bAD55500c26E31135932677B276e06AE',
        router: '0x4F1111145AB659CF9BBB45442F54A5D427783DaA',
        wrapToken: '0x56403E93d5D593E29d47eE5C743058A5993FD2B3',
        wrapUsdPair: '0x215bfCCF305135AbCAa18b9C0e9738924a53A0E6',
        poolFactory: '0x964fD9F84e0e543648Bd1835A6A3A33DEbC7E0f8',
        stateCalHelper: '0xF258e00021773b7603109887BF2eeb80d5C6f601',
        logic: '0xE1550e06C6759b48cD0a6f5851029A30a6Fee735',
    },
    stableCoins: ['0x8F98902cf8255ab9D403Dfa68875b1024cd6C3d4'],
};
exports.BNB_CONFIG = {
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    rpcToGetLogs: 'https://bscrpc.com',
    timePerBlock: 3000,
    addresses: {
        reserveTokenPrice: '0x0000000000000000000000000000000000000001',
        uniswapFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        token: '0xc28A7e46bE1BB74a63aD32784D785A941D1954ab',
        multiCall: '0x270bf3040041160e309130d6AF61c1a7aBf2497D',
        pairsInfo: '0xF258e00021773b7603109887BF2eeb80d5C6f601',
        pairsV3Info: '0x448816f124c9cE4234907566ECef78f95bdDaF5E',
        bnA: '0xE0b291b76b78b1a73Da8F2Cc2e717267065bF95A',
        tokensInfo: '0x7094BFd0db1b11Dd677831d4f9eB81bb15348c21',
        router: '0x4F1111145AB659CF9BBB45442F54A5D427783DaA',
        wrapToken: '0xaf9173D7fcd8f18d57Ea7EE2b3DeCF263C25679F',
        wrapUsdPair: '0xBf4CC059DfF52AeFe7f12516e4CA4Bc691D97474',
        poolFactory: '0x2B528278eEEf8d30838fCC6297e6f28D4F03b1BD',
        stateCalHelper: '0x95a7d5edfD4701478D3ACA5DCb69D549D83E3c52',
    },
    stableCoins: ['0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'],
};
exports.ARBITRUM_CONFIG = {
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    rpcToGetLogs: 'https://arb1.arbitrum.io/rpc',
    timePerBlock: 1000,
    nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    addresses: {
        reserveTokenPrice: '0xBf4CC059DfF52AeFe7f12516e4CA4Bc691D97474',
        uniswapFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        token: '0x2c57087D69f1Bf5974CA21ADb50b9dBEF8CF51CC',
        stateCalHelper: '0x185808A2e2819840d2A0BcF8c90D815Fb9da2054',
        multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
        pairsInfo: '0x81C8f6bC2a602B9Ad403116ab4c0EC1a0e5B49B1',
        pairsV3Info: '0x81C8f6bC2a602B9Ad403116ab4c0EC1a0e5B49B1',
        bnA: '0x357FF35761979254F93a21995b20d9071904603d',
        tokensInfo: '0x696630d3aE600147902c71bF967ec3eb7a2C8b44',
        router: '0xbc9a257e43f7b3b1a03aEBE909f15e95A4928834',
        wrapToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        wrapUsdPair: '0xCB0E5bFa72bBb4d16AB5aA0c60601c438F04b4ad',
    },
    stableCoins: [
        '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    ],
};
exports.DEFAULT_CONFIG = exports.ARBITRUM_CONFIG;
exports.DEFAULT_CHAIN = 42161;
//# sourceMappingURL=configs.js.map