import { assert } from 'chai'
import { describe } from 'mocha'
import { calcAmountOuts } from './calcAmountOuts.spec'
import { createPool } from './createPool.spec'
import { getBalanceAndAllowance } from './getBalanceAndAllowance.spec'
import { getPairAddress } from './getPairAddress.spec'
import { getPairDetail } from './getPairDetail.spec'
import { getPairDetailV3 } from './getPairDetailV3.spec'
import { getResource } from './getResource.spec'
import { getTokenPrice } from './getTokenPrice.spec'
import { history } from './history.spec'
import { swap } from './swap.spec'

describe('Derivable Unit Test', () => {
  it('Calculate Amount Outs', async () => {
    await calcAmountOuts()
  })

  it('Create Pool', async () => {
    await createPool()
  })

  it('Get Balances And Allowance', async () => {
    await getBalanceAndAllowance()
  })

  it('Get Pair Address', async () => {
    await getPairAddress()
  })

  it('Get Pair Detail', async () => {
    await getPairDetail()
  })

  it('Get Pair Detail V3', async () => {
    await getPairDetailV3()
  })

  it('Get Resource', async () => {
    await getResource()
  })

  it('Get Token Price', async () => {
    await getTokenPrice()
  })

  it('History', async () => {
    await history()
  })

  it('Swap', async () => {
    await swap()
  })
})
