import { Engine } from '../src/engine'
import { bn, numberToWei } from '../src/utils/helper'
import { getTestConfigs } from './shared/testConfigs'
import { POOL_IDS } from '../src/utils/constant'
import { NATIVE_ADDRESS } from '../dist/utils/constant'

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
      tokenOut:
        Object.values(currentPool.pools)[0].poolAddress + '-' + POOL_IDS.C,
      // tokenOut: CONFIGS[1337].nativeToken,
      amountOutMin: 0,
    },
  ]
  await engine.SWAP.multiSwap(steps, bn(6000000))
}

testLocal()
