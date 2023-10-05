import { Engine } from '../src/engine'
import { getTestConfigs } from './shared/testConfigs'

const testLocal = async () => {
  const configs = getTestConfigs(56)
  const engine = new Engine(configs)
  await engine.initServices()
  await engine.RESOURCE.fetchResourceData(
    '0xE3C75f8963E4CA02ea9a281c32b41FdfC248e07f',
  )

  console.log({
    poolGroups: engine.RESOURCE.poolGroups,
    pools: engine.RESOURCE.pools,
    tokens: engine.RESOURCE.tokens,
    swapLogs: engine.RESOURCE.swapLogs,
  })
}

testLocal()
