import { ethers, Wallet } from 'ethers'

const PRIVATE_KEY =
  '0x60f5906de1edfc4d14eb4aea49ed4c06641bbdbd5a56092392308e9730598373'
const account = '0xbC52C688c34A480c6785A38715c693Bb22863DE1'
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
const walletPrivateKey = new Wallet(PRIVATE_KEY)
const wallet = walletPrivateKey.connect(provider)

const TestConfigs = {
  [1337]: {
    chainId: 1337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545',
    account,
    signer: wallet,
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
