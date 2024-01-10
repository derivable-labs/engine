import { Engine } from '../../src/engine'
import { bn, numberToWei } from '../../src/utils/helper'
import { TestConfiguration } from '../shared/configurations/configurations'

const conf = new TestConfiguration()

export const createPool = async (chainId: number, poolAddresses: Array<string>): Promise<any | undefined> => {
  try {
    const configs = conf.get(chainId)
    const engine = new Engine(configs.account, configs)
    await engine.RESOURCE.fetchResourceData(poolAddresses, configs.account)
    const amountInit = bn(numberToWei(10))
    const k = 7
    const a = bn(numberToWei(1))
    const b = bn(numberToWei(1))
    const oracle = '0x000000000000012c00000000bf4cc059dff52aefe7f12516e4ca4bc691d97474'
    const halfLife = 19932680
    const mark = bn(38).shl(128)
    const initTime = 0
    const params = {
      amountInit,
      recipient: configs.account,
      k,
      a,
      b,
      oracle,
      mark,
      halfLife,
      initTime,
    }
    const result = await engine.CREATE_POOL.createPool(params, bn(6000000))
    return result
  } catch (error) {
    return undefined
  }
}
