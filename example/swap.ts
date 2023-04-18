import {Engine} from "../src/engine";
import {bn, numberToWei, weiToNumber} from "../src/utils/helper";
import {getTestConfigs} from "./shared/testConfigs";
import {POOL_IDS} from "../src/utils/constant";
import {CONFIGS} from "../src/utils/configs";

const testLocal = async () => {
  const engine = new Engine(getTestConfigs(1337))
  await engine.RESOURCE.fetchResourceData(engine.account || '')

  const currentPool = Object.values(engine.RESOURCE.poolGroups)[0]
  engine.setCurrentPool({
    ...currentPool,
    // logic: currentPool.logic,
    // cTokenPrice: currentPool.cTokenPrice
  })

  const steps = [
    {
      amountIn: bn(1233),
      // tokenIn: CONFIGS[1337].nativeToken,
      // tokenIn: Object.values(currentPool.pools)[0].TOKEN_R,
      tokenIn: Object.values(currentPool.pools)[0].poolAddress + "-" + POOL_IDS.B,
      tokenOut: Object.values(currentPool.pools)[1].poolAddress + "-" + POOL_IDS.A,
      amountOutMin: 0
    }
  ]
  await engine.SWAP.multiSwap(steps, bn(6000000))

  //
  // const a = await engine.SWAP.calculateAmountOuts(steps)
  // console.log(a)
}

testLocal()
