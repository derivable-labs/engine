import {ethers, Wallet} from "ethers";

const PRIVATE_KEY = '60f5906de1edfc4d14eb4aea49ed4c06641bbdbd5a56092392308e9730598373'
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const walletPrivateKey = new Wallet(PRIVATE_KEY)
const wallet = walletPrivateKey.connect(provider)

const TestConfigs = {
  [31337]: {
    chainId: 31337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545/',
    account: '0x704cF59B16Fd50Efd575342B46Ce9C5e07076A4a',
    provider: new ethers.providers.JsonRpcProvider("http://localhost:8545"),
    providerToGetLog: new ethers.providers.JsonRpcProvider('http://localhost:8545/'),
    signer: wallet
  },
  [1337]: {
    chainId: 1337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545/',
    account: '0xbC52C688c34A480c6785A38715c693Bb22863DE1',
    provider: new ethers.providers.JsonRpcProvider("http://localhost:8545"),
    providerToGetLog: new ethers.providers.JsonRpcProvider('http://localhost:8545/'),
    signer: wallet
  },
  [56]: {
    chainId: 56,
    scanApi: '',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    account: '0x704cF59B16Fd50Efd575342B46Ce9C5e07076A4a',
    provider: new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/'),
    providerToGetLog: new ethers.providers.JsonRpcProvider('https://bscrpc.com'),
    signer: wallet
  }
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
      }
    }
  }
}
