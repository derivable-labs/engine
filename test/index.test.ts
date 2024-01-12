import { bn } from '../src/utils/helper'
import { calcAmountOuts } from './logic/calcAmountOuts'
import { createPool } from './logic/createPool'
import { getBalanceAndAllowance } from './logic/getBalanceAndAllowance'
import { getPairAddress } from './logic/getPairAddress'
import { getPairDetail } from './logic/getPairDetail'
import { getPairDetailV3 } from './logic/getPairDetailV3'
import { getResource } from './logic/getResource'
import { history } from './logic/history'
import { swap } from './logic/swap'
import _ from "lodash";
import { TestConfiguration } from './shared/configurations/configurations'

import { Interceptor } from './shared/libs/interceptor'
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

  test('Calc Amount Outs', async () => {
    const [ res, gasUsed ] = await calcAmountOuts(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'],
      0.1,
    )
    expect(gasUsed.toNumber()).toBeGreaterThan(0)
    expect(gasUsed.toNumber()).toBeLessThan(2000000)
    const amountOut = res[res.length-1].amountOut
    expect(amountOut.toNumber()).toBeGreaterThan(44105)
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

  test('Resource', async () => {
    const resource = await getResource(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      ['0x867A3c9256911AEF110f4e626936Fa3BBc750cBE'],
    )

    expect(resource.newResource.pools['0x867A3c9256911AEF110f4e626936Fa3BBc750cBE']).toBeDefined()
    expect(resource.whiteListResource.pools['0xA332693827f78ECe3Ea044DC3F8EAa9763f60c6a']).toBeDefined()
    expect(resource.cacheResource.pools['0x867A3c9256911AEF110f4e626936Fa3BBc750cBE']).toBeDefined()
    expect(_.isEqual(resource.cacheResource, resource.newResource))
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
    const chainId = 56
    const poolAddresses = []
    const poolAddress = '0x3Db6cB9E2F52673C978AdF99477C73eC0d5b5712'
    const amount = 1

    const result = await swap(chainId, poolAddresses, poolAddress, amount)

    expect(result).toBeDefined()
  })
})
