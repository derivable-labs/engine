import { Engine } from '../../src/engine'
import { TestConfiguration } from '../shared/configurations/configurations'

const conf = new TestConfiguration()

export const getLargestPoolAddress = async (chainId: number, baseToken: string, quoteTokens: Array<string>): Promise<string> => {
  const configs = conf.get(chainId)
  const engine = new Engine(configs)
  await engine.initServices()

  const pairAddress = await engine.UNIV3PAIR.getLargestPoolAddress({
    baseToken,
    quoteTokens,
  })

  return pairAddress
}
