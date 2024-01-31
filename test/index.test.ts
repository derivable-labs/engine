import { bn } from '../src/utils/helper'
import { calcAmountOuts } from './logic/calcAmountOuts'
import { getBalanceAndAllowance } from './logic/getBalanceAndAllowance'
import { getLargestPoolAddress } from './logic/getPairAddress'
import { getPairDetail } from './logic/getPairDetail'
import { getPairDetailV3 } from './logic/getPairDetailV3'
import { getResource } from './logic/getResource'
import { history } from './logic/history'
import { swap } from './logic/swap'
import _ from "lodash";
import { TestConfiguration } from './shared/configurations/configurations'

import { Interceptor } from './shared/libs/interceptor'
import { aggregator } from './logic/aggregator'
import { SwapSide } from '@paraswap/sdk'
const interceptor = new Interceptor()

const confs = new TestConfiguration()

function genConfig(chainId, account) {
  return {
    ...confs.get(chainId),
    account,
  }
}

describe('Derivable Tools', () => {
  beforeEach(() => {
    interceptor.setContext(expect.getState().currentTestName)
  })

  test('AmountOut-arb', async () => {
    const [ res, gasUsed ] = await calcAmountOuts(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'],
      0.1,
    )
    const amountOut = res[res.length-1].amountOut
    expect(gasUsed.toNumber()).toBeCloseTo(3900000, -7)
    expect(amountOut.toNumber()).toBeCloseTo(41750, -3)
  })

  test('AmountOut-bsc', async () => {
    const [ res, gasUsed ] = await calcAmountOuts(
      genConfig(56, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      ['0x2C3d0F3dcD28b5481a50E1DD0071378f92D56954'],
      0.1,
    )
    const amountOut = res[res.length-1].amountOut
    expect(gasUsed.toNumber()).toEqual(298063)
    expect(amountOut.toNumber()).toEqual(99973)
  })

  test('BnA-base', async () => {
    const { balances, allowances, maturity } = await getBalanceAndAllowance(
      genConfig(8453, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [],
    )
    expect(balances['0x5f41DdC103d4Bf07aec45C3EEbEEf47520b98fD2']).toEqual(bn('0x010f0cccddeae95f0000'))
    expect(allowances['0xF9afc64E5Dde15E941e2C01dd848b2EC67FD08b8-16']).toEqual(bn('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'))
    expect(maturity['0x44C46037AD3621f95a488d898c1e9CFDa0F58e95-32']).toEqual(bn('0x6504358b'))
  })

  test('BnA-bsc', async () => {
    const { balances, allowances, maturity } = await getBalanceAndAllowance(
      genConfig(56, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [],
    )
    expect(balances['0xBa95100a0c3abaD1e10414Be77347D3D0900D8c2']).toEqual(bn('0xbfa90a51783ee28500f8'))
    expect(allowances['0x55d398326f99059fF775485246999027B3197955']).toEqual(bn('0x1ac36bad4d8dbc4cfb'))
    expect(maturity['0x2C3d0F3dcD28b5481a50E1DD0071378f92D56954-48']).toBeUndefined()
  })

  test('BnA-arb', async () => {
    const { balances, allowances, maturity } = await getBalanceAndAllowance(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [],
    )
    expect(balances['0x7df120445BfDd80A3c9fbFd3acC3b22123b58D1e']).toEqual(bn('0x08ffedfb595975900000'))
    expect(allowances['0x867A3c9256911AEF110f4e626936Fa3BBc750cBE-48']).toEqual(bn('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'))
    expect(maturity['0x867A3c9256911AEF110f4e626936Fa3BBc750cBE-16']).toEqual(bn('0x658aa708'))
  })

  test('LargestPool', async () => {
    const chainId = 42161
    const baseToken = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'
    const quoteTokens = ['0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8']
    const pairAddress = await getLargestPoolAddress(chainId, baseToken, quoteTokens)
    expect(pairAddress).toEqual('0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443')
  })

  // test('PairDetailV2', async () => {
  //   const pairDetail = await getPairDetail(
  //     genConfig(42161, ''),
  //     '0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB',
  //     ['0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB', '0x905dfCD5649217c42684f23958568e533C711Aa3'],
  //   )
  //   expect(pairDetail).toBeDefined()
  // })

  test('PairDetailV3', async () => {
    const { pairInfo } = await getPairDetailV3(
      genConfig(42161, ''),
      '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443'
    )
    expect(pairInfo.token0.name).toEqual('Wrapped Ether')
    expect(pairInfo.token1.name).toEqual('USD Coin (Arb1)')
  })

  test('Resource-arb', async () => {
    const poolAddress = '0x867A3c9256911AEF110f4e626936Fa3BBc750cBE'
    const resource = await getResource(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [poolAddress],
    )

    const pool = resource.newResource.pools[poolAddress] ?? resource.whiteListResource.pools[poolAddress] ?? resource.cacheResource.pools[poolAddress]
    expect(pool).toBeDefined()
    expect(pool?.riskFactor).toEqual('0.006344299538270911')
  })

  test('Resource-bsc', async () => {
    const poolAddress = '0x2C3d0F3dcD28b5481a50E1DD0071378f92D56954'
    const resource = await getResource(
      genConfig(56, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [poolAddress],
    )

    const pool = resource.newResource.pools[poolAddress] ?? resource.whiteListResource.pools[poolAddress] ?? resource.cacheResource.pools[poolAddress]
    expect(pool).toBeDefined()
    expect(pool?.riskFactor).toEqual('-0.005637139247406234')
  })

  test('History', async () => {
    const { swapTxs, positions } = await history(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [],
      '0x9E37cb775a047Ae99FC5A24dDED834127c4180cD'
    )
    const keys = Object.keys(positions)
    expect(keys.length).toEqual(3)
    expect(positions[keys[0]].avgPriceR).toEqual('2195.511006')
    expect(positions[keys[1]].avgPrice).toEqual('0.000380553119609019')
    expect(positions[keys[2]].amountR).toEqual(bn('0x01100ffba9e0c7'))
  })

  test('Swap', async () => {
    await swap(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'],
      '0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96',
      0.1,
    )
  })

  test('Aggregator', async () => {
    const getRateData = {
      srcToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      srcDecimals: 18,
      amount: '1000000000',
      destToken: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      destDecimals: 18,
      side: SwapSide.SELL,
    }
    await aggregator(genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'), getRateData)
  })
})
