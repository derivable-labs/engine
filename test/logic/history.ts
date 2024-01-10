import { Engine } from '../../src/engine'
import { TestConfiguration } from '../shared/configurations/configurations'

const conf = new TestConfiguration()

export const history = async (chainId: number, poolAddresses: Array<string>, poolAddress: string, account: string) => {
  const configs = conf.get(chainId)

  const engine = new Engine(configs)
  await engine.initServices()

  await engine.RESOURCE.fetchResourceData(poolAddresses, account)

  // console.log({
  //   pools: engine.RESOURCE.pools,
  //   tokens: engine.RESOURCE.tokens,
  //   swapLogs: engine.RESOURCE.swapLogs,
  // })

  const currentPool = engine.RESOURCE.poolGroups[poolAddress]
  engine.setCurrentPool({
    ...currentPool,
  })

  const swapTxs = engine?.HISTORY.formatSwapHistory({
    tokens: engine.RESOURCE.tokens,
    transferLogs: JSON.parse(JSON.stringify(engine.RESOURCE.transferLogs)),
    swapLogs: JSON.parse(JSON.stringify(engine.RESOURCE.swapLogs)),
  })
  // console.log(swapTxs)

  const positions = engine?.HISTORY.generatePositions({
    tokens: engine.RESOURCE.tokens,
    logs: JSON.parse(JSON.stringify(engine.RESOURCE.swapLogs)),
  })

  return {
    swapTxs,
    positions,
  }
}
