import { ethers, Wallet } from 'ethers'

const PRIVATE_KEY =
  '0x60f5906de1edfc4d14eb4aea49ed4c06641bbdbd5a56092392308e9730598373'
const account = '0xE3C75f8963E4CA02ea9a281c32b41FdfC248e07f'
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org')
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
  [421613]: {
    chainId: 421613,
    account,
    signer: wallet,
  },
  [42161]: {
    chainId: 42161,
    scanApi: 'https://api.arbiscan.io/api',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    account,
    signer: wallet,
  },
  [8453]: {
    chainId: 8453,
    scanApi: 'https://api.basescan.org/api',
    rpcUrl: 'https://mainnet.base.org',
    account,
    signer: wallet,
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
