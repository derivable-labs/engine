import { Engine } from '../../src/engine'
import { TestConfiguration } from '../shared/configurations/configurations'

const conf = new TestConfiguration()

export const getResource = async (chainId: number): Promise<any | undefined> => {
  try {
    const configs = conf.get(chainId)
    const engine = new Engine(configs)
    await engine.initServices()

    const newResource = await engine.RESOURCE.getNewResource(configs.account)

    const formatSwapHistory = await engine?.HISTORY.formatSwapHistory({
      tokens: Object.values(newResource.tokens),
      transferLogs: newResource.transferLogs,
      swapLogs: newResource.swapLogs,
    })

    return {
      newResource,
      formatSwapHistory,
    }
  } catch (error) {
    return undefined
  }
}
