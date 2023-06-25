import { Engine } from '../src/engine'
import { getTestConfigs } from './shared/testConfigs'
import { BigNumber } from 'ethers'
import { FixedPoint } from '../src/utils/number'

const testLocal = async () => {
  const configs = getTestConfigs(1337)
  const engine = new Engine(configs.account, configs, 1337)
  await engine.RESOURCE.fetchResourceData(
    '0xbC52C688c34A480c6785A38715c693Bb22863DE1',
  )

  console.log({
    poolGroups: engine.RESOURCE.poolGroups,
    pools: engine.RESOURCE.pools,
    tokens: engine.RESOURCE.tokens,
    swapLogs: engine.RESOURCE.swapLogs,
  })
}

const _r = (xk: BigNumber, v: BigNumber, R: BigNumber): BigNumber => {
  let r = v.mul(xk).div(FixedPoint.Q128)
  if (r.lt(R.div(2))) {
    const denominator = v.mul(xk.div(4)).div(FixedPoint.Q128)
    const minuend = R.mul(R).div(denominator)
    r = R.sub(minuend)
  }
  return r
}

testLocal()
