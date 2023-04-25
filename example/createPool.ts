import {ethers} from "ethers";
import {Engine} from "../src/engine";
import {bn, numberToWei, weiToNumber} from "../src/utils/helper";
import {getTestConfigs} from "./shared/testConfigs";
const SECONDS_PER_YEAR = 31536000

const testLocal = async () => {
  const engine = new Engine(getTestConfigs(1337))
  await engine.RESOURCE.fetchResourceData(engine.account || '')

  const powers = [3, -3, 9, -9];
  const priceToleranceRatio = bn(0);
  const rentRate = bn(10).shl(128).div(100).div(SECONDS_PER_YEAR);
  const deleverageRate = bn(95).shl(128).div(100)
  const params = {
    priceToleranceRatio,
    rentRate,
    deleverageRate,
    powers
  }
  await engine.CREATE_POOL.createPool(params, bn(6000000))
}

testLocal()
