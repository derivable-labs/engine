import {BigNumber} from "ethers";

export type ParseLogType = {
  address: string
  name: string
  topic: string
  args: any
}

export type PoolType = {
  pool: string
  logic: string
  cTokenPrice: number
  baseSymbol: string
  states: any
  baseToken: string
  quoteToken: string
  cToken: string
  powers: number[]
  dTokens: string[]
  priceToleranceRatio: BigNumber
  quoteSymbol: string
  rentRate: BigNumber
  deleverageRate: BigNumber
  poolAddress: string
  quoteId: number
  baseId: number
  basePrice: string
  cPrice: number
}

export type SwapLog = {
  address: string,
  args: any[],
  name: string
  // ...
}

export type PoolsType = {[key: string]: PoolType}
export type TokenType = {
  address:string
  decimal:number
  name: string
  symbol: string
}

export type BalancesType = {[key: string]: BigNumber}
export type AllowancesType = {[key: string]: BigNumber}
