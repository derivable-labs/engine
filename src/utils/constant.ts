export const LARGE_VALUE =
  '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const fee10000 = 30
export const MINI_SECOND_PER_DAY = 86400000
export const LP_PRICE_UNIT = 10000
export const TIME_TO_REFRESH_STATE = 30000
export const CHART_API_ENDPOINT = "http://18.142.162.9/";

export const LOCALSTORAGE_KEY = {
  DDL_LOGS: 'ddl-log-v1.0',
  LAST_BLOCK_DDL_LOGS: 'last-block-ddl-log-v1.0',
  SWAP_LOGS: 'swap-log-v1.0',
  SWAP_BLOCK_LOGS: 'last-block-swap-log-v1.0'
}

export const ddlGenesisBlock = {
  56: 23917200,
  31337: 0,
  42161: 84499330,
}

export const POOL_IDS = {
  cToken: 0x20000,
  cp: 0x10000,
  cw: 0x10001,
  quote: 0x20001,
  base: 0x20002,
  token0: 262144,
  token1: 262145,
  native: '0x000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  R: 0x00,
  A: 0x10,
  B: 0x20,
  C: 0x30,
}

export const EventDataAbis = {
  PoolCreated: [
    'address UTR',
    'address TOKEN',
    'address LOGIC',
    'bytes32 ORACLE',
    'address TOKEN_R',
    'uint256 MARK',
    'uint256 INIT_TIME',
    'uint256 HALF_LIFE',
    'uint256 k'
  ],
  Swap: [
    'address payer',
    'address poolIn',
    'address poolOut',
    'address recipient',
    'uint sideIn',
    'uint sideOut',
    'uint amountIn',
    'uint amountOut'
  ]
}
