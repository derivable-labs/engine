import { Engine } from '../src/engine'
import { bn, numberToWei } from '../src/utils/helper'
import { getTestConfigs } from './shared/testConfigs'
import { NATIVE_ADDRESS, POOL_IDS } from '../src/utils/constant'

const testLocal = async () => {
  const configs = getTestConfigs(1337)
  const engine = new Engine(configs.account, configs, 1337)
  await engine.RESOURCE.fetchResourceData(engine.account || '')

  const currentPool = Object.values(engine.RESOURCE.poolGroups)[0]
  engine.setCurrentPool({
    ...currentPool,
  })

  const steps = [
    {
      amountIn: bn(numberToWei(1)),
      tokenIn: NATIVE_ADDRESS,
      tokenOut:Object.values(currentPool.pools)[0].poolAddress + '-' + POOL_IDS.C,
      amountOutMin: 0,
    },
  ]

  await engine.SWAP.multiSwap(steps, bn(6000000)).catch((e) => {
    console.log(e)
  })
}

testLocal()
