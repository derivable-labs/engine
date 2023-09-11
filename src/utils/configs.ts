import { Storage } from '../types'
import { Signer } from 'ethers'

export interface config {
  chainId: number
  rpcUrl: string
  rpcToGetLogs: string
  scanApi?: string
  explorer?: string
  scanName?: string
  ddlGenesisBlock?: number
  timePerBlock: number
  theGraphExchange?: string
  candleChartApi?: string
  storage?: Storage
  poolAddress?: string
  nativeToken?: string
  gasLimitDefault?: number
  addresses: Partial<DerivableContractAddress>
  stableCoins: string[]
}

export interface DerivableContractAddress {
  token: string
  multiCall: string
  reserveTokenPrice: string
  uniswapFactory: string
  pairsInfo: string
  pairsV3Info: string
  bnA: string
  tokensInfo: string
  router: string
  wrapToken: string
  wrapUsdPair: string
  poolFactory: string
  stateCalHelper: string
  logic: string
}

export const TESTNET_CONFIG: config = {
  chainId: 1337,
  rpcUrl: 'http://localhost:8545',
  rpcToGetLogs: 'http://localhost:8545',
  timePerBlock: 3000,
  nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  addresses: {
    reserveTokenPrice: '0x0000000000000000000000000000000000000001',
    uniswapFactory: '0x2B528278eEEf8d30838fCC6297e6f28D4F03b1BD',
    token: '0x2e10024346cDd08E1e9071B16a51d89d46de8003',
    multiCall: '0x7AF7e1669Af4c76B566BFeC7AB722ba6dE0719A3',
    pairsInfo: '0xa3030Cef13eFd3E625c576A622E6123Cf7B4006d',
    pairsV3Info: '0x72d6D4aB65491cbF6DAF5D38838fdEBb7603f4B0',
    bnA: '0x0748990Cd23F13545805295eD1aED30D9f335984',
    tokensInfo: '0x2bdcF38cd1cb4db04ac6604ECaa02C2fbf1e13e2',
    router: '0x4F1111145AB659CF9BBB45442F54A5D427783DaA',
    wrapToken: '0x56403E93d5D593E29d47eE5C743058A5993FD2B3',
    wrapUsdPair: '0x215bfCCF305135AbCAa18b9C0e9738924a53A0E6',
    poolFactory: '0x964fD9F84e0e543648Bd1835A6A3A33DEbC7E0f8',
    stateCalHelper: '0x270bf3040041160e309130d6AF61c1a7aBf2497D',
    logic: '0xE1550e06C6759b48cD0a6f5851029A30a6Fee735',
  },
  stableCoins: ['0x8F98902cf8255ab9D403Dfa68875b1024cd6C3d4'],
}

export const BNB_CONFIG: config = {
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
    logic: '0x4413d44163C7Ba2B285787719a9ed2DdFC6f57E0',
    stateCalHelper: '0x95a7d5edfD4701478D3ACA5DCb69D549D83E3c52',
  },
  stableCoins: ['0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'],
}

export const ARBITRUM_CONFIG: config = {
  chainId: 42161,
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  rpcToGetLogs: 'https://arb1.arbitrum.io/rpc',
  timePerBlock: 1000,
  nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  gasLimitDefault: 50000000,
  addresses: {
    reserveTokenPrice: '0xBf4CC059DfF52AeFe7f12516e4CA4Bc691D97474',
    uniswapFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    token: '0x1BA630bEd23129aed65BFF106cd15C4B457a26e8',
    stateCalHelper: '0xa8724363831bd5a199aa37aa4641d184dd873653',
    multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    pairsInfo: '0x81C8f6bC2a602B9Ad403116ab4c0EC1a0e5B49B1',
    pairsV3Info: '0x81C8f6bC2a602B9Ad403116ab4c0EC1a0e5B49B1',
    bnA: '0x357FF35761979254F93a21995b20d9071904603d',
    tokensInfo: '0x696630d3aE600147902c71bF967ec3eb7a2C8b44',
    router: '0xbc9a257e43f7b3b1a03aEBE909f15e95A4928834',
    poolFactory: '0xF817EBA38BebD48a58AE38360306ea0E243077cd',
    logic: '0x4413d44163C7Ba2B285787719a9ed2DdFC6f57E0',
    wrapToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    wrapUsdPair: '0xCB0E5bFa72bBb4d16AB5aA0c60601c438F04b4ad',
  },
  stableCoins: [
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  ],
}

export const BASE_CONFIG: config = {
  chainId: 8453,
  rpcUrl: 'https://mainnet.base.org',
  rpcToGetLogs: 'https://mainnet.base.org',
  timePerBlock: 1000,
  nativeToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  gasLimitDefault: 5000000,
  addresses: {
    reserveTokenPrice: '0x0772BD1981f6092329F12FC041B83b2faBBB1A25',
    uniswapFactory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
    token: '0x639FF414c14E0819CBfF344818926277d36B0494',
    stateCalHelper: '0xd43e4c479710f150cdd107b6fb51135179adb355',
    multiCall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    pairsInfo: '0x81C8f6bC2a602B9Ad403116ab4c0EC1a0e5B49B1',
    pairsV3Info: '0x81C8f6bC2a602B9Ad403116ab4c0EC1a0e5B49B1',
    bnA: '0x357FF35761979254F93a21995b20d9071904603d',
    tokensInfo: '0x696630d3aE600147902c71bF967ec3eb7a2C8b44',
    router: '0x0e690e6667D48b9E61D9C6eECcb064b8Cb3e3a54',
    poolFactory: '0xF23f5A7c17C626DF1F340b6055C4F2EDE488BA18',
    logic: '0xE0FE3B315D0Bbe6e91346EC9Fb2522E4CD8A11EF',
    wrapToken: '0x4200000000000000000000000000000000000006',
    wrapUsdPair: '0x0000000000000000000000000000000000000000',
  },
  stableCoins: [
    '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  ],
}

export const CONFIGS = {
  8453: BASE_CONFIG,
  42161: ARBITRUM_CONFIG
}

export const DEFAULT_CONFIG = ARBITRUM_CONFIG
export const DEFAULT_CHAIN = 42161
