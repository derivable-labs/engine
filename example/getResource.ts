import {Engine} from "../src/engine";
import {getTestConfigs} from "./shared/testConfigs";

const testLocal = async () => {
  const engine = new Engine(getTestConfigs(1337))
  await engine.RESOURCE.fetchResourceData('0x704cF59B16Fd50Efd575342B46Ce9C5e07076A4a')
  console.log({
    pools: engine.RESOURCE.pools,
    tokens: engine.RESOURCE.tokens,
    swapLogs: engine.RESOURCE.swapLogs
  })
}

testLocal()
