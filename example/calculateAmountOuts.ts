import {Engine} from "../src/engine";
import {bn, numberToWei} from "../src/utils/helper";
import {getTestConfigs} from "./shared/testConfigs";
import {POOL_IDS} from "../src/utils/constant";

const testLocal = async () => {
  const engine = new Engine(getTestConfigs(1337))
  await engine.RESOURCE.fetchResourceData('0xbC52C688c34A480c6785A38715c693Bb22863DE1')

  const currentPool = Object.values(engine.RESOURCE.pools)[0]
  engine.setCurrentPool({
    ...currentPool,
    logic: currentPool.logic,
    cTokenPrice: currentPool.cTokenPrice
  })

  const steps = [
    {
      amountIn: bn(numberToWei(1)),
      tokenIn: currentPool.baseToken,
      tokenOut: currentPool.poolAddress + "-" + POOL_IDS.cp,
      amountOutMin: 0
    }
  ]

  // const steps = [
  //   {
  //     "tokenIn": "0xf911f6cD7fe229A91E59B815a4B91a449732FE3f-0",
  //     "tokenOut": "0xf911f6cD7fe229A91E59B815a4B91a449732FE3f-4",
  //     "amountIn":bn("0x0865f009565de8bba2"),
  //     "amountOutMin": 0
  //   },
  //   {
  //     "tokenIn": "0xf911f6cD7fe229A91E59B815a4B91a449732FE3f-6",
  //     "tokenOut": "0xf911f6cD7fe229A91E59B815a4B91a449732FE3f-4",
  //     "amountIn": bn("0x065a4da25d3f45efb139"),
  //     "amountOutMin": 0
  //   }
  // ]

  const res = await engine.SWAP.calculateAmountOuts(steps)
  console.log(res)
}

testLocal()
