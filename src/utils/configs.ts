import { Storage } from '../types'
import { ethers, Signer } from 'ethers'

export interface IEngineConfig {
  env?: 'development' | 'production'
  account?: string
  signer?: ethers.providers.JsonRpcSigner
  scanApiKey?: string
  chainId: number
  storage: Storage
}

export interface INetworkConfig {
  chainId: number
  rpc: string
  rpcGetLog?: string
  rpcGetProof?: string
  scanApi?: string
  explorer?: string
  scanName?: string
  timePerBlock: number
  candleChartApi?: string
  storage?: Storage
  gasLimitDefault: number
  name: string
  nativeSymbol: string
  wrappedTokenAddress: string
  nativePriceUSD: number
  stablecoins: string[]
  tokens?: { [address: string]: { price?: number; symbol: string; name: string; decimals: number, logo: string } }
  helperContract: IHelperContract
  uniswap: IUniswapContractAddress
  derivable: IDerivableContractAddress
}

export interface IHelperContract {
  utr: string
  multiCall: string
}

export interface IUniswapContractAddress {
  v3Factory: string
}

export interface IDerivableContractAddress {
  version: number
  startBlock: number
  poolFactory: string
  logic: string
  token: string
  stateCalHelper: string
  feeReceiver: string
  tokenDescriptor: string
  compositeFetcher: string
  multiCall: string
  uniswapV2Fetcher?: string
}

export const DEFAULT_CHAIN = 42161
