import {Engine} from "../src/engine";
import {ethers, Wallet} from "ethers";
import {bn, numberToWei, weiToNumber} from "../src/utils/helper";
import {getTestConfigs} from "./shared/testConfigs";

const testLocal = async () => {
  const engine = new Engine(getTestConfigs(1337))
  await engine.RESOURCE.fetchResourceData('0x704cF59B16Fd50Efd575342B46Ce9C5e07076A4a')

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
      tokenOut: currentPool.poolAddress + "-0",
      amountOutMin: 0
    }
  ]
  await engine.SWAP.multiSwap(steps)

  //
  // const a = await engine.SWAP.calculateAmountOuts(steps)
  // console.log(a)
}

testLocal()
