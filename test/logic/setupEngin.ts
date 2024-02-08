import {Engine} from '../../src/engine'
import {TestConfiguration} from '../shared/configurations/configurations'

const conf = new TestConfiguration()
export const getEngine = async (
  chainId: number,
): Promise<any | undefined> => {
  const configs = conf.get(chainId)

  const engine = new Engine(configs)
  await engine.initServices()
  return engine
}
