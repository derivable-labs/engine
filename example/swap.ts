import {Engine} from "../src/engine";
import {ethers, Wallet} from "ethers";
import {bn, numberToWei, weiToNumber} from "../src/utils/helper";
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
      tokenIn: currentPool.cToken,
      tokenOut: currentPool.poolAddress + "-" + POOL_IDS.cp,
      amountOutMin: 0
    }
  ]
  await engine.SWAP.multiSwap(steps)

  //
  // const a = await engine.SWAP.calculateAmountOuts(steps)
  // console.log(a)
}

testLocal()
