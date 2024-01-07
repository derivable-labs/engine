import { Engine } from '../src/engine'
import { getTestConfigs } from './shared/configurations/configuration.spec'
import { interceptorUtils } from './shared/libs/interceptor.spec'

interceptorUtils()

export const getPairDetail = async () => {
  const configs = getTestConfigs(42161)
  const engine = new Engine(configs)
  await engine.initServices()

  const pairInfo = await engine.UNIV2PAIR.getPairInfo({
    pairAddress: '0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB',
  })

  const pairsInfo = await engine.UNIV2PAIR.getPairsInfo({
    pairAddresses: ['0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB', '0x905dfCD5649217c42684f23958568e533C711Aa3'],
  })
  console.log({
    pairInfo,
    pairsInfo,
  })
}
