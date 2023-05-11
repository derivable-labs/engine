import { ethers, Wallet } from 'ethers'

const PRIVATE_KEY =
  '0x60f5906de1edfc4d14eb4aea49ed4c06641bbdbd5a56092392308e9730598373'
const account = '0xbC52C688c34A480c6785A38715c693Bb22863DE1'
const provider = new ethers.providers.JsonRpcProvider( 'http://localhost:8545')
const walletPrivateKey = new Wallet(PRIVATE_KEY)
const wallet = walletPrivateKey.connect(provider)

const TestConfigs = {
  [1337]: {
    chainId: 1337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545',
    account,
    signer: wallet,
    addresses: {
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
  },
  [42161]: {
    chainId: 42161,
    scanApi: 'https://api.arbiscan.io/api',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    account,
    signer: wallet,
    addresses: {
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
  },
}

export const getTestConfigs = (chainId: number) => {
  let storageData = {}
  return {
    ...TestConfigs[chainId],
    storage: {
      getItem: (key: string) => {
        return storageData[key]
      },
      setItem: (key: string, value: string) => {
        storageData[key] = value
      },
    },
  }
}
