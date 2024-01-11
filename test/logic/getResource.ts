import {Engine} from '../../src/engine'
import {TestConfiguration} from '../shared/configurations/configurations'

const conf = new TestConfiguration()
export const getResource = async (
  chainId: number,
  poolAddresses: Array<string>,
  account: string
): Promise<any | undefined> => {
  try {
    const storageData: any = {}
    const configs = conf.get(chainId)
    configs.storage = {
      getItem: (key: string) => {
        return storageData[key]
      },
        setItem: (key: string, value: string) => {
        storageData[key] = value
      },
    }

    const engine = new Engine(configs)
    await engine.initServices()

    const newResource = await engine.RESOURCE.getNewResource(account)
    const whiteListResource = await engine.RESOURCE.getWhiteListResource(poolAddresses)
    const cacheResource =  await engine.RESOURCE.getResourceCached(account)

    return {
      newResource,
      whiteListResource,
      cacheResource
    }
  } catch (error) {
    return undefined
  }
}
