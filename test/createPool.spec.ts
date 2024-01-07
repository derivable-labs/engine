import { Engine } from '../src/engine'
import { bn, numberToWei, weiToNumber } from '../src/utils/helper'
import { getTestConfigs } from './shared/configurations/configuration.spec'
import { interceptorUtils } from './shared/libs/interceptor.spec'

interceptorUtils()

export const createPool = async () => {
  const configs = getTestConfigs(1337)
  const engine = new Engine(configs)
  await engine.RESOURCE.fetchResourceData(['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], '0xbC52C688c34A480c6785A38715c693Bb22863DE1')
  const amountInit = bn(numberToWei(10))
  const recipient = '0xbC52C688c34A480c6785A38715c693Bb22863DE1'
  const k = 7
  const a = bn(numberToWei(1))
  const b = bn(numberToWei(1))
  const oracle = '0x000000000000012c00000000bf4cc059dff52aefe7f12516e4ca4bc691d97474'
  const halfLife = 19932680
  const mark = bn(38).shl(128)
  const initTime = 0
  const params = {
    amountInit,
    recipient,
    k,
    a,
    b,
    oracle,
    mark,
    halfLife,
    initTime,
  }
  await engine.CREATE_POOL.createPool(params, bn(6000000))
}
