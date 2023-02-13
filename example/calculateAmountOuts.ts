import {Engine} from "../src/engine";
import {bn, numberToWei} from "../src/utils/helper";
import {getTestConfigs} from "./shared/testConfigs";

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
      tokenIn: currentPool.cToken,
      tokenOut: currentPool.poolAddress + "-0",
      amountOutMin: 0
    },
    {
      amountIn: bn(numberToWei(1)),
      tokenIn: currentPool.cToken,
      tokenOut: currentPool.poolAddress + "-2",
      amountOutMin: 0
    }
  ]
  const res = await engine.SWAP.calculateAmountOuts(steps)
  console.log(res)
}

testLocal()
