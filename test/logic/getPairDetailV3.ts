import { Engine } from '../../src/engine'
import { IEngineConfig } from '../../src/utils/configs'
import { bn } from '../../src/utils/helper'

export const getPairDetailV3 = async (configs: IEngineConfig, pairAddress: string): Promise<any> => {
  const engine = new Engine(configs)
  await engine.initServices()

  const pairInfo = await engine.UNIV3PAIR.getPairInfo({
    pairAddress,
  })
  const oracle = bn(1)
    .shl(255)
    .add(bn(300).shl(256 - 64))
    .add('0xBf4CC059DfF52AeFe7f12516e4CA4Bc691D97474')
    .toHexString()

  return {
    pairInfo,
    oracle,
  }
}
