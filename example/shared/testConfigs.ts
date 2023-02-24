import {ethers, Wallet} from "ethers";

const PRIVATE_KEY = '0x595cbe4fa0f0ec80e8f3f66373d60f3943baf00347382804b8bcc598a9e5bd77'
const account = '0xDe6b460B889b4Aa9Cf90B453E24b3b569D34D39f'
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const walletPrivateKey = new Wallet(PRIVATE_KEY)
const wallet = walletPrivateKey.connect(provider)

const TestConfigs = {
  [31337]: {
    chainId: 31337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545/',
    account,
    provider: new ethers.providers.JsonRpcProvider("http://localhost:8545"),
    providerToGetLog: new ethers.providers.JsonRpcProvider('http://localhost:8545/'),
    signer: wallet
  },
  [1337]: {
    chainId: 1337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545/',
    account,
    provider: new ethers.providers.JsonRpcProvider("http://localhost:8545"),
    providerToGetLog: new ethers.providers.JsonRpcProvider('http://localhost:8545/'),
    signer: wallet
  },
  [56]: {
    chainId: 56,
    scanApi: '',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    account,
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
