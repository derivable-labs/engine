import { Engine } from '../src/engine'
import { getTestConfigs } from './shared/testConfigs'
import {LOCALSTORAGE_KEY} from "../src/utils/constant";

const testLocal = async () => {
  const configs = getTestConfigs(42161)
  const engine = new Engine(configs)
  await engine.initServices()

  const searchResult = await engine.RESOURCE.searchIndex("PENDLE")
  console.log(searchResult)
  const newResource = await engine.RESOURCE.getNewResource("0x0dbca96184eed4c6a1291403c93311ebe6646785")
  console.log(newResource)
  const cached = configs.storage.getItem(42161 + '-' + LOCALSTORAGE_KEY.ACCOUNT_LOGS + '-' + "0x0dbca96184eed4c6a1291403c93311ebe6646785")
  const cachedResource = await engine.RESOURCE.getResourceCached("0x0dbca96184eed4c6a1291403c93311ebe6646785")
  console.log(cachedResource)

  // await engine.RESOURCE.fetchResourceData(
  //   '0x0dbca96184eed4c6a1291403c93311ebe6646785',
  // )
  // await engine.RESOURCE.getWhiteListResource()

  await engine.RESOURCE.loadPoolStates("0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96")
  // await engine.RESOURCE.searchIndex("PENDLE")

  console.log({
    poolGroups: engine.RESOURCE.poolGroups,
    pools: engine.RESOURCE.pools,
    tokens: engine.RESOURCE.tokens,
    swapLogs: engine.RESOURCE.swapLogs,
  })
}

testLocal()
