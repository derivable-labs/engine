import { Engine } from '../src/engine'
import { ethers } from 'ethers'
import { getTestConfigs } from './shared/testConfigs'

const testLocal = async () => {
  const engine = new Engine(getTestConfigs(1337))
  await engine.RESOURCE.fetchResourceData(
    '0xbC52C688c34A480c6785A38715c693Bb22863DE1',
  )

  console.log({
    pools: engine.RESOURCE.pools,
    tokens: engine.RESOURCE.tokens,
    swapLogs: engine.RESOURCE.swapLogs,
  })

  const currentPool = Object.values(engine.RESOURCE.pools)[0]
  engine.setCurrentPool({
    ...currentPool,
    logic: currentPool.logic,
    cTokenPrice: currentPool.cTokenPrice,
  })

  const swapTxs = engine?.HISTORY.formatSwapHistory({
    logs: JSON.parse(JSON.stringify(engine.RESOURCE.swapLogs)),
  })

  console.log(swapTxs)
}

testLocal()
