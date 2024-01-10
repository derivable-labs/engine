import { describe } from 'mocha'
import { calcAmountOuts } from './logic/calcAmountOuts'
import { createPool } from './logic/createPool'
import { getBalanceAndAllowance } from './logic/getBalanceAndAllowance'
import { getPairAddress } from './logic/getPairAddress'
import { getPairDetail } from './logic/getPairDetail'
import { getPairDetailV3 } from './logic/getPairDetailV3'
import { getResource } from './logic/getResource'
import { getTokenPrice } from './logic/getTokenPrice'
import { history } from './logic/history'
import { swap } from './logic/swap'

import { intercept } from './shared/libs/interceptor'
intercept()

describe('Derivable Unit Test', () => {
  it('History', async() => {
    const { swapTxs, positions } = await history(
      42161,
      ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'],
      '0xbb8b02f3a4c3598e6830fc6740f57af3a03e2c96',
      '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df',
    )
    const n = Object.keys(positions).length
    console.log('number of pos', n)
    // expect(n, 'must have position').gt(0)
  })
})
