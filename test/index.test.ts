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
  test('Calc Amount Outs', async () => {
    const chainId = 42161
    const poolAddresses = ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96']
    const amountIn = 0.01
    const amountOut = await calcAmountOuts(chainId, poolAddresses, amountIn)
    expect(amountOut).toBeDefined()
    expect(amountOut).toBeGreaterThan(0)
  })

  test('Create Pool', async () => {
    const chainId = 42161
    const poolAddresses = []
    const result = await createPool(chainId, poolAddresses)
    expect(result).toBeDefined()
  })

  test('Get Balance And Allowance', async () => {
    const chainId = 8453
    const poolAddresses = []
    const result = await getBalanceAndAllowance(chainId, poolAddresses)
    expect(result).toBeDefined()
  })

  test('Get Pair Address', async () => {
    const chainId = 42161
    const baseToken = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'
    const quoteTokens = ['0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8']
    const pairAddress = await getPairAddress(chainId, baseToken, quoteTokens)

    expect(pairAddress).toBeDefined()
    expect(pairAddress?.length).toBeGreaterThan(0)
  })

  test('Get Pair Detail', async () => {
    const chainId = 42161
    const pairAddress = '0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB'
    const pairAddresses = ['0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB', '0x905dfCD5649217c42684f23958568e533C711Aa3']
    const pairDetail = await getPairDetail(chainId, pairAddress, pairAddresses)

    expect(pairDetail).toBeDefined()
  })

  test('Get Pair Detail V3', async () => {
    const chainId = 42161
    const pairAddress = '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443'
    const pairDetailV3 = await getPairDetailV3(chainId, pairAddress)

    expect(pairDetailV3).toBeDefined()
  })

  test('Get Resource', async () => {
    const chainId = 42161
    const resource = await getResource(chainId)

    expect(resource).toBeDefined()
  })

  test('Get Token Price', async () => {
    const chainId = 8453
    const poolAddresses = []
    const baseToken = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
    const quoteToken = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
    const cToken = '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443'

    const result = await getTokenPrice(chainId, poolAddresses, baseToken, quoteToken, cToken)

    expect(result).toBeDefined()
  })

  test('History', async () => {
    const chainId = 8453
    const poolAddresses = []
    const poolAddress = '0x9E37cb775a047Ae99FC5A24dDED834127c4180cD'

    const result = await history(chainId, poolAddresses, poolAddress)

    expect(result).toBeDefined()
  })

  test('Swap', async () => {
    const chainId = 56
    const poolAddresses = []
    const poolAddress = '0x3Db6cB9E2F52673C978AdF99477C73eC0d5b5712'
    const amount = 1

    const result = await swap(chainId, poolAddresses, poolAddress, amount)

    expect(result).toBeDefined()
  })
})
