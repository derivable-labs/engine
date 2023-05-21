import { Engine } from '../src/engine'
import { bn, numberToWei } from '../src/utils/helper'
import { getTestConfigs } from './shared/testConfigs'
import { NATIVE_ADDRESS, POOL_IDS } from '../src/utils/constant'
import PowerState from '../src/services/power'

const testLocal = async () => {
  const configs = getTestConfigs(1337)
  const engine = new Engine(configs.account, configs, 1337)
  await engine.RESOURCE.fetchResourceData(engine.account || '')

  const currentPool = Object.values(engine.RESOURCE.poolGroups)[0]
  engine.setCurrentPool({
    ...currentPool,
  })

  const tokens = engine.RESOURCE.tokens
  const tokenArr = tokens.map((t) => t.address)

  const res = await engine.BNA.getBalanceAndAllowance({
    tokens: tokenArr,
  })
  //
  // const power = new PowerState({ k: currentPool.k })
  // power.loadPools(currentPool)
  // let steps: any = power.getSwapSteps(
  //   res.balances,
  //   3,
  //   bn(numberToWei(-1)),
  //   NATIVE_ADDRESS,
  // )
  // steps = steps.map((step: any) => {
  //   return {
  //     ...step,
  //     amountOutMin: 0,
  //   }
  // })
  // console.log(a)

  const steps = [
    {
      amountIn: bn(numberToWei(1)),
      tokenIn:
        Object.values(currentPool.pools)[1].poolAddress + '-' + POOL_IDS.A,
      tokenOut:
        Object.values(currentPool.pools)[1].poolAddress + '-' + POOL_IDS.B,
      // tokenOut: CONFIGS[1337].nativeToken,
      amountOutMin: 0,
    },
  ]

  // console.log(steps[1].amountIn.toString())
  // console.log(
  //   res.balances['0x0b7C12C88326cd2ab068470fa098Ac3189c4F8D1-16'].toString(),
  // )
  await engine.SWAP.multiSwap(steps, bn(6000000)).catch((e) => {
    console.log(e)
  })
}

testLocal()
