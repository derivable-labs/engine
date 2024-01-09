import { Engine } from '../../src/engine'
import { TestConfiguration } from '../shared/configurations/configurations'

const conf = new TestConfiguration()
export const getResource = async (chainId: number, wallet: string) => {
  const configs = conf.get(chainId)
  const engine = new Engine(configs)
  await engine.initServices()

  // const searchResult = await engine.RESOURCE.searchIndex('PENDLE')
  // console.log(searchResult)
  const newResource = await engine.RESOURCE.getNewResource(wallet)
  console.log(newResource.swapLogs)
  // const cached = configs.storage.getItem(chainId + '-' + LOCALSTORAGE_KEY.ACCOUNT_LOGS + '-' + wallet)
  // const cachedResource = await engine.RESOURCE.getResourceCached(wallet)
  // console.log(cachedResource.swapLogs)

  // await engine.RESOURCE.fetchResourceData(
  //   '0x0dbca96184eed4c6a1291403c93311ebe6646785',
  // )]
  console.log(
    await engine?.HISTORY.formatSwapHistory({
      tokens: Object.values(newResource.tokens),
      transferLogs: newResource.transferLogs,
      swapLogs: newResource.swapLogs,
    }),
  )
  // console.log(whitelistResource)
  // await engine.RESOURCE.loadPoolStates('0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96')
  // await engine.RESOURCE.searchIndex("PENDLE")

  // console.log({
  //   poolGroups: engine.RESOURCE.poolGroups,
  //   pools: engine.RESOURCE.pools,
  //   tokens: engine.RESOURCE.tokens,
  //   swapLogs: engine.RESOURCE.swapLogs,
  // })
}
