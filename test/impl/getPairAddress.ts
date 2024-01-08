import { Engine } from '../../src/engine'
import { TestConfiguration } from '../shared/configurations/configurations'
import { interceptorUtils } from '../shared/libs/interceptor'

interceptorUtils()

const conf = new TestConfiguration()

export const getPairAddress = async (chainId: number, baseToken: string, quoteTokens: Array<string>) => {
  const configs = conf.get(42161)
  const engine = new Engine(configs)
  await engine.initServices()

  const pairAddress = await engine.UNIV3PAIR.getLargestPoolAddress({
    baseToken,
    quoteTokens,
  })

  console.log(pairAddress)
}
