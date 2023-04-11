import {ethers} from "ethers"
import {Engine} from "../src/engine"
import {bn, numberToWei, weiToNumber} from "../src/utils/helper"
import {getTestConfigs} from "./shared/testConfigs"

const testLocal = async () => {
  const engine = new Engine(getTestConfigs(1337))
  await engine.RESOURCE.fetchResourceData("0xbC52C688c34A480c6785A38715c693Bb22863DE1")
  const amountInit = bn("150000000000000000000")
  const recipient = "0xbC52C688c34A480c6785A38715c693Bb22863DE1"
  const k = 11
  const a = bn(numberToWei(1))
  const b = bn(numberToWei(1))
  const params = {
    amountInit,
    recipient,
    k,
    a,
    b
  }
  await engine.CREATE_POOL.createPool(params, bn(6000000))

}

testLocal()
