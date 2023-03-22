import {ethers} from "ethers";
import {Engine} from "../src/engine";
import {bn, numberToWei, weiToNumber} from "../src/utils/helper";
import {getTestConfigs} from "./shared/testConfigs";

const testLocal = async () => {
  const engine = new Engine(getTestConfigs(1337))
  await engine.RESOURCE.fetchResourceData(engine.account || '')

  const recipient = "0xbC52C688c34A480c6785A38715c693Bb22863DE1";
  const markPrice = bn("7788445287819172527008699396495269118");
  const power = 4;
  const a = bn(numberToWei(1));
  const b = bn(numberToWei(1));
  const params = {
    recipient,
    markPrice,
    power,
    a,
    b
  }
  await engine.CREATE_POOL.createPool(params, bn(6000000))
}

testLocal()
