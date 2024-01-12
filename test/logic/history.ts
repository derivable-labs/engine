import { Engine } from '../../src/engine'
import { IEngineConfig } from '../../src/utils/configs'

export const history = async (
  configs: IEngineConfig,
  poolAddresses: Array<string>,
  poolAddress: string,
): Promise<any> => {
  const engine = new Engine(configs)
  await engine.initServices()

  await engine.RESOURCE.fetchResourceData(poolAddresses, configs.account!)

  const currentPool = engine.RESOURCE.poolGroups[poolAddress]
  engine.setCurrentPool({
    ...currentPool,
  })

  const swapTxs = engine?.HISTORY.formatSwapHistory({
    tokens: engine.RESOURCE.tokens,
    transferLogs: JSON.parse(JSON.stringify(engine.RESOURCE.transferLogs)),
    swapLogs: JSON.parse(JSON.stringify(engine.RESOURCE.swapLogs)),
  })

  const positions = engine?.HISTORY.generatePositions({
    tokens: engine.RESOURCE.tokens,
    logs: JSON.parse(JSON.stringify(engine.RESOURCE.swapLogs)),
  })

  return {
    swapTxs,
    positions,
  }
}
