import { Engine } from '../src/engine'
import { bn, numberToWei } from '../src/utils/helper'
import { getTestConfigs } from './shared/testConfigs'
import { NATIVE_ADDRESS, POOL_IDS } from '../src/utils/constant'

const testLocal = async () => {
  const configs = getTestConfigs(42161)
  const engine = new Engine(configs.account, configs, 42161)
  await engine.RESOURCE.fetchResourceData('0x07C62D0a326F72dE430ddBEFD5ea35f6324CDce7')

  const currentPool = Object.values(engine.RESOURCE.poolGroups)[0]
  engine.setCurrentPool({
    ...currentPool,
  })

  const steps = [
    {
      amountIn: bn(numberToWei(0.001)),
      tokenIn:NATIVE_ADDRESS,
      tokenOut:Object.values(currentPool.pools)[0].poolAddress + '-' + POOL_IDS.C,
      amountOutMin: 0,
    },
  ]

  const res = await engine.SWAP.calculateAmountOuts(steps)
  console.log(res)
}

testLocal()
