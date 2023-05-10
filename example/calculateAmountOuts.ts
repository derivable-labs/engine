import { Engine } from '../src/engine'
import { bn, numberToWei } from '../src/utils/helper'
import { getTestConfigs } from './shared/testConfigs'
import { POOL_IDS } from '../src/utils/constant'
import { CONFIGS } from '../dist/utils/configs'
import { NATIVE_ADDRESS } from '../dist/utils/constant'

const testLocal = async () => {
  const configs = getTestConfigs(1337)
  const engine = new Engine(configs.account, configs)
  await engine.RESOURCE.fetchResourceData(engine.account || '')

  const currentPool = Object.values(engine.RESOURCE.poolGroups)[0]
  engine.setCurrentPool({
    ...currentPool,
  })

  const steps = [
    {
      amountIn: bn(numberToWei(0.1)),
      tokenIn:
        Object.values(currentPool.pools)[0].poolAddress + '-' + POOL_IDS.C,
      tokenOut: NATIVE_ADDRESS,
      amountOutMin: 0,
    },
  ]

  const res = await engine.SWAP.calculateAmountOuts(steps)
  console.log(res)
}

testLocal()
