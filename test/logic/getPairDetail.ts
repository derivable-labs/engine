import { Engine } from '../../src/engine'
import { TestConfiguration } from '../shared/configurations/configurations'

const conf = new TestConfiguration()

export const getPairDetail = async (chainId: number, pairAddress: string, pairAddresses: Array<string>): Promise<any | undefined> => {
  try {
    const configs = conf.get(chainId)
    const engine = new Engine(configs)
    await engine.initServices()

    const pairInfo = await engine.UNIV2PAIR.getPairInfo({
      pairAddress,
    })

    const pairsInfo = await engine.UNIV2PAIR.getPairsInfo({
      pairAddresses,
    })
    return {
      pairInfo,
      pairsInfo,
    }
  } catch (error) {
    return undefined
  }
}
