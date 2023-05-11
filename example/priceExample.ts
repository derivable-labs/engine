import { Engine } from '../src/engine'
import { getTestConfigs } from './shared/testConfigs'
import { weiToNumber } from '../src/utils/helper'

const test = async () => {
  const configs = getTestConfigs(1337)
  const engine = new Engine(configs.account, configs, 1337)
  await engine.RESOURCE.fetchResourceData(
    '0xbC52C688c34A480c6785A38715c693Bb22863DE1',
  )

  const nativePrice = await engine.PRICE.getNativePrice()
  console.log('nativePrice', nativePrice)

  const pool = Object.values(engine.RESOURCE.pools)[0]

  //@ts-ignore
  console.log('rb', weiToNumber(pool.states.Rb))
  //@ts-ignore
  console.log('rq', weiToNumber(pool.states.Rq))

  const cpPrice = await engine.PRICE.fetchCpPrice({
    states: pool.states,
    cToken: pool.cToken,
    poolAddress: pool.poolAddress,
    cTokenPrice: pool.cPrice,
  })
  console.log('cpPrice', cpPrice)
}

test()
