import {Engine} from "../src/engine";
import {ethers} from "ethers";
import {getTestConfigs} from "./shared/testConfigs";

const test = async () => {
  const engine = new Engine(getTestConfigs(1337))
  await engine.RESOURCE.fetchResourceData('0xbC52C688c34A480c6785A38715c693Bb22863DE1')
  const tokens = engine.RESOURCE.tokens
  const tokenArr = tokens.map((t) => t.address)

  const res = await engine.BNA.getBalanceAndAllowance({
    tokens: tokenArr
  })
  console.log(res)
}

test()
