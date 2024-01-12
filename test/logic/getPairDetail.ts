import { Engine } from '../../src/engine'
import { IEngineConfig } from '../../src/utils/configs'

export const getPairDetail = async (configs: IEngineConfig, pairAddress: string, pairAddresses: Array<string>): Promise<any | undefined> => {
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
}
