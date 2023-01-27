import {BigNumber} from "ethers";

export type Storage = {
  setItem: (itemName: string, value: string) => void
  getItem: (itemName: string) => string
}

export type ParseLogType = {
  address: string
  name: string
  topic: string
  args: any
  topics: string[]
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

export type PoolErc1155StepType = {
  idIn: BigNumber | string,
  idOut: BigNumber | string,
  amountIn: BigNumber
  amountOutMin: BigNumber | string | number
}

export type StepType = {
  tokenIn: string,
  tokenOut: string,
  amountIn: BigNumber
}


export type SwapStepType = {
  tokenIn: string,
  tokenOut: string,
  amountIn: BigNumber
  amountOutMin: BigNumber | string | number
}
