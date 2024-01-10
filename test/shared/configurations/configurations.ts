import dotenv from 'dotenv'
import { Wallet, ethers } from 'ethers'

dotenv.config()

const account = process.env.ACCOUNT_ADDRESS ?? '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf'
const privateKey = process.env.PRIVATE_KEY ?? '0x0000000000000000000000000000000000000000000000000000000000000001'

export class TestConfiguration {
  private readonly conf: { [key: string]: any } = {}

  constructor() {
    this.conf[1337] = {
      chainId: 1337,
      scanApiKey: process.env['SCAN_API_KEY_1337'] ?? '',
      scanApi: process.env['SCAN_API_URL_1337'] ?? '',
      rpcUrl: process.env['RPC_URL_1337'] ?? 'http://localhost:8545',
      account,
      signer: this.walletConnect(process.env['RPC_URL_1337'] ?? 'http://localhost:8545', privateKey),
      env: 'development',
    }

    this.conf[56] = {
      chainId: 56,
      scanApiKey: process.env['SCAN_API_KEY_56'] ?? '',
      scanApi: process.env['SCAN_API_URL_56'] ?? '',
      rpcUrl: process.env['RPC_URL_56'] ?? 'https://bsc.rpc.blxrbdn.com',
      account,
      signer: this.walletConnect(process.env['RPC_URL_56'] ?? 'https://bsc.rpc.blxrbdn.com', privateKey),
      env: 'development',
    }

    this.conf[42161] = {
      chainId: 42161,
      scanApiKey: process.env['SCAN_API_KEY_42161'] ?? '',
      scanApi: process.env['SCAN_API_URL_42161'] ?? 'https://api.arbiscan.io/api',
      rpcUrl: process.env['RPC_URL_42161'] ?? 'https://arb1.arbitrum.io/rpc',
      account,
      signer: this.walletConnect(process.env['RPC_URL_42161'] ?? 'https://arb1.arbitrum.io/rpc', privateKey),
      env: 'development',
    }

    this.conf[8453] = {
      chainId: 8453,
      scanApiKey: process.env['SCAN_API_KEY_8453'] ?? '',
      scanApi: process.env['SCAN_API_URL_8453'] ?? 'https://api.basescan.org/api',
      rpcUrl: process.env['RPC_URL_8453'] ?? 'https://mainnet.base.org',
      account,
      signer: this.walletConnect(process.env['RPC_URL_8453'] ?? 'https://mainnet.base.org', privateKey),
      env: 'development',
    }
  }

  private walletConnect(rpcUrl: string, privateKey: string): Wallet | undefined {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      return new Wallet(privateKey).connect(provider)
    } catch (error) {
      return undefined
    }
  }

  public get(chainId: number): any {
    return this.conf[chainId]
  }

  public set(chainId: number, value: any): void {
    this.conf[chainId] = value
  }
}
