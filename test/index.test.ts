import { describe } from 'mocha'
import { calcAmountOuts } from './impl/calcAmountOuts'
import { createPool } from './impl/createPool'
import { getBalanceAndAllowance } from './impl/getBalanceAndAllowance'
import { getPairAddress } from './impl/getPairAddress'
import { getPairDetail } from './impl/getPairDetail'
import { getPairDetailV3 } from './impl/getPairDetailV3'
import { getResource } from './impl/getResource'
import { getTokenPrice } from './impl/getTokenPrice'
import { history } from './impl/history'
import { swap } from './impl/swap'

describe('Derivable Unit Test', () => {
  it('Calculate Amount Outs', async () => {
    await calcAmountOuts(42161, ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], 0.01)
  })

  it('Create Pool', async () => {
    await createPool(1337, ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], '0xbC52C688c34A480c6785A38715c693Bb22863DE1')
  })

  it('Get Balances And Allowance', async () => {
    await getBalanceAndAllowance(8453, ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], '0xD9de0da3adE2a8b2FB27C453c065D46aa01574BA')
  })

  it('Get Pair Address', async () => {
    await getPairAddress(42161, '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', [
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    ])
  })

  it('Get Pair Detail', async () => {
    await getPairDetail(42161, '0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB', [
      '0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB',
      '0x905dfCD5649217c42684f23958568e533C711Aa3',
    ])
  })

  it('Get Pair Detail V3', async () => {
    await getPairDetailV3(42161, '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443')
  })

  it('Get Resource', async () => {
    await getResource(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df')
  })

  it('Get Token Price', async () => {
    await getTokenPrice(
      42161,
      ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'],
      '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443',
    )
  })

  it('History', async () => {
    await history(42161, ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], '0xbb8b02f3a4c3598e6830fc6740f57af3a03e2c96')
  })

  it('Swap', async () => {
    await swap(56, ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], 1, '0xbb8b02f3a4c3598e6830fc6740f57af3a03e2c96')
  })
})
