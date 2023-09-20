import { Engine } from '../src/engine'
import { ethers } from 'ethers'
import { getTestConfigs } from './shared/testConfigs'

const testLocal = async () => {
  const configs = getTestConfigs(8453)
  const engine = new Engine(configs)
  await engine.initServices()

  await engine.RESOURCE.fetchResourceData(
    '0x5555a222c465b1873421d844e5d89ed8eb3E5555',
  )

  console.log({
    pools: engine.RESOURCE.pools,
    tokens: engine.RESOURCE.tokens,
    swapLogs: engine.RESOURCE.swapLogs,
  })

  const currentPool = Object.values(engine.RESOURCE.poolGroups)[0]
  engine.setCurrentPool({
    ...currentPool,
  })

  const swapTxs = engine?.HISTORY.formatSwapHistory({
    tokens: engine.RESOURCE.tokens,
    logs: JSON.parse(JSON.stringify(engine.RESOURCE.swapLogs)),
  })
  console.log(swapTxs)

  const positions = engine?.HISTORY.generatePositions({
    tokens: engine.RESOURCE.tokens,
    logs: JSON.parse(JSON.stringify(engine.RESOURCE.swapLogs)),
  })

  console.log(positions)
}

testLocal()
