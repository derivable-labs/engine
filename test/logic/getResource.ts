import {Engine} from '../../src/engine'
import { IEngineConfig } from '../../src/utils/configs'
import {TestConfiguration} from '../shared/configurations/configurations'

export const getResource = async (
  configs: IEngineConfig,
  poolAddresses: Array<string>,
): Promise<any> => {
  const storageData: any = {}
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

  const newResource = await engine.RESOURCE.getNewResource(configs.account!)
  const whiteListResource = await engine.RESOURCE.getWhiteListResource(poolAddresses)
  const cacheResource =  await engine.RESOURCE.getResourceCached(configs.account!)

  return {
    newResource,
    whiteListResource,
    cacheResource
  }
}
