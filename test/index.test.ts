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

import { interceptorUtils } from './shared/libs/interceptor'

interceptorUtils()

describe('Derivable Unit Test', () => {
  it('Calculate Amount Outs', () => {
    calcAmountOuts(42161, ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], 0.01).then((res) => {})
  })

  it('Create Pool', () => {
    createPool(1337, ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], '0xbC52C688c34A480c6785A38715c693Bb22863DE1').then((res) => {})
  })

  it('Get Balances And Allowance', () => {
    getBalanceAndAllowance(8453, ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], '0xD9de0da3adE2a8b2FB27C453c065D46aa01574BA').then(
      (res) => {},
    )
  })

  it('Get Pair Address', () => {
    getPairAddress(42161, '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', [
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    ]).then((res) => {})
  })

  it('Get Pair Detail', () => {
    getPairDetail(42161, '0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB', [
      '0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB',
      '0x905dfCD5649217c42684f23958568e533C711Aa3',
    ]).then((res) => {})
  })

  it('Get Pair Detail V3', () => {
    getPairDetailV3(42161, '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443').then((res) => {})
  })

  it('Get Resource', () => {
    getResource(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df').then((res) => {})
  })

  it('Get Token Price', () => {
    getTokenPrice(
      42161,
      ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'],
      '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443',
    ).then((res) => {})
  })

  it('History', () => {
    history(42161, ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], '0xbb8b02f3a4c3598e6830fc6740f57af3a03e2c96').then((res) => {})
  })

  it('Swap', () => {
    swap(56, ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], 1, '0xbb8b02f3a4c3598e6830fc6740f57af3a03e2c96').then((res) => {})
  })
})
