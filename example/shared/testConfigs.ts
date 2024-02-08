import { ethers, Wallet } from 'ethers'
require('dotenv').config()

const account = process.env.ACCOUNT_ADDRESS as string
const provider = new ethers.providers.JsonRpcProvider('https://bsc.rpc.blxrbdn.com')
const walletPrivateKey = new Wallet(process.env.PRIVATE_KEY as string ?? '0x0000000000000000000000000000000000000000000000000000000000000001')
const wallet = walletPrivateKey.connect(provider)

const TestConfigs = {
  [1337]: {
    chainId: 1337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545',
    account,
    signer: wallet,
  },
  [56]: {
    chainId: 56,
    account,
    signer: wallet,
    env: 'development'
  },
  [42161]: {
    chainId: 42161,
    scanApi: 'https://api.arbiscan.io/api',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    account,
    signer: wallet,
    env: 'development'
  },
  [8453]: {
    chainId: 8453,
    scanApi: 'https://api.basescan.org/api',
    rpcUrl: 'https://mainnet.base.org',
    account,
    signer: wallet,
    env: 'development'
  },
}

export const getTestConfigs = (chainId: number) => {
  let storageData: any = {}
  return {
    //@ts-ignore
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
