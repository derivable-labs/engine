export const LARGE_VALUE =
  '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const fee10000 = 30
export const MINI_SECOND_PER_DAY = 86400000
export const LP_PRICE_UNIT = 10000
export const TIME_TO_REFRESH_STATE = 30000
export const CHART_API_ENDPOINT = {
  42161: 'https://api-chart-42161.derivable.org/',
  8453: 'https://api-chart-8453.derivable.org/'
}


export const LOCALSTORAGE_KEY = {
  DDL_LOGS: 'ddl-log-v1.0',
  LAST_BLOCK_DDL_LOGS: 'last-block-ddl-log-v1.0',
  SWAP_LOGS: 'swap-log-v1.0',
  SWAP_BLOCK_LOGS: 'last-block-swap-log-v1.0',
}

export const ddlGenesisBlock = {
  56: 23917200,
  31337: 0,
  42161: 107513624,
  8453: 2443770,
}

export const POOL_IDS = {
  cToken: 0x20000,
  cp: 0x10000,
  cw: 0x10001,
  quote: 0x20001,
  base: 0x20002,
  token0: 262144,
  token1: 262145,
  native: 0x01,
  R: 0x00,
  A: 0x10,
  B: 0x20,
  C: 0x30,
}

export const EventDataAbis = {
  [42161]: {
    PoolCreated: [
      'bytes32 ORACLE',
      'uint k',
      'uint MARK',
      'uint INTEREST_HL',
      'uint PREMIUM_RATE',
      'uint MATURITY',
      'uint MATURITY_VEST',
      'uint MATURITY_RATE',
      'uint OPEN_RATE',
      'address poolAddress'
    ],
    Swap: [
      'address payer',
      'address poolIn',
      'address poolOut',
      'address recipient',
      'uint sideIn',
      'uint sideOut',
      'uint amountIn',
      'uint amountOut',
    ],
    Swap1: [
      'address payer',
      'address poolIn',
      'address poolOut',
      'address recipient',
      'uint sideIn',
      'uint sideOut',
      'uint amountIn',
      'uint amountOut',
      'uint price',
    ],
    Swap2: [
      'address payer',
      'address poolIn',
      'address poolOut',
      'address recipient',
      'uint sideIn',
      'uint sideOut',
      'uint amountIn',
      'uint amountOut',
      'uint price',
      'uint priceR',
    ],
  },
  [8453]: {
    PoolCreated: [
      'address FETCHER',
      'bytes32 ORACLE',
      'uint k',
      'uint MARK',
      'uint INTEREST_HL',
      'uint PREMIUM_HL',
      'uint MATURITY',
      'uint MATURITY_VEST',
      'uint MATURITY_RATE',
      'uint OPEN_RATE',
      'address poolAddress'
    ],
    Swap: [
      'address payer',
      'address poolIn',
      'address poolOut',
      'address recipient',
      'uint sideIn',
      'uint sideOut',
      'uint amountIn',
      'uint amountOut',
    ],
    Swap1: [
      'address payer',
      'address poolIn',
      'address poolOut',
      'address recipient',
      'uint sideIn',
      'uint sideOut',
      'uint amountIn',
      'uint amountOut',
      'uint price',
    ],
    Swap2: [
      'address payer',
      'address poolIn',
      'address poolOut',
      'address recipient',
      'uint sideIn',
      'uint sideOut',
      'uint amountIn',
      'uint amountOut',
      'uint price',
      'uint priceR',
    ],
  }

}
