import { Engine } from '../../src/engine'
import { bn } from '../../src/utils/helper'
import { TestConfiguration } from '../shared/configurations/configurations'

const conf = new TestConfiguration()

export const getPairDetailV3 = async (chainId: number, pairAddress: string) => {
  const configs = conf.get(chainId)
  const engine = new Engine(configs)
  await engine.initServices()

  const pairInfo = await engine.UNIV3PAIR.getPairInfo({
    pairAddress: '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443',
  })

  console.log({
    pairInfo,
  })
  const oracle = bn(1)
    .shl(255)
    .add(bn(300).shl(256 - 64))
    .add('0xBf4CC059DfF52AeFe7f12516e4CA4Bc691D97474')
    .toHexString()
  console.log(oracle)
}
