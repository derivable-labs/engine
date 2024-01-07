import { ethers, Wallet } from 'ethers'
import dotenv from 'dotenv'

dotenv.config()

const ACCOUNT = process.env.ACCOUNT_ADDRESS as string
const RPC_URL = process.env.RPC_URL as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
const wallet = new Wallet(PRIVATE_KEY).connect(provider)

const TestConfigs = {
  [1337]: {
    chainId: 1337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545',
    account: ACCOUNT,
    signer: wallet,
  },
  [56]: {
    chainId: 56,
    account: ACCOUNT,
    signer: wallet,
    env: 'development',
  },
  [42161]: {
    chainId: 42161,
    scanApi: 'https://api.arbiscan.io/api',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    account: ACCOUNT,
    signer: wallet,
    env: 'development',
  },
  [8453]: {
    chainId: 8453,
    scanApi: 'https://api.basescan.org/api',
    rpcUrl: 'https://mainnet.base.org',
    account: ACCOUNT,
    signer: wallet,
    env: 'development',
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
