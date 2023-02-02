import {Engine}   from "../src/engine";
import {ethers}      from "ethers";

const testLocal = async () => {
  let storageData = {}
  const engine = new Engine({
    chainId: 31337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545/',
    account: '0x704cF59B16Fd50Efd575342B46Ce9C5e07076A4a',
    provider: new ethers.providers.JsonRpcProvider("http://localhost:8545"),
    providerToGetLog: new ethers.providers.JsonRpcProvider('http://localhost:8545/'),
  })
  await engine.RESOURCE.fetchResourceData('0x704cF59B16Fd50Efd575342B46Ce9C5e07076A4a')

  console.log({
    pools: engine.RESOURCE.pools,
    tokens: engine.RESOURCE.tokens,
    swapLogs: engine.RESOURCE.swapLogs
  })

  const currentPool = Object.values(engine.RESOURCE.pools)[0]
  engine.setCurrentPool({
    ...currentPool,
    logic: currentPool.logic,
    cTokenPrice: currentPool.cTokenPrice
  })

  const swapTxs = engine?.HISTORY.formatSwapHistory({
    logs:  engine.RESOURCE.swapLogs,
    poolAddress: currentPool.poolAddress,
    states: currentPool.states,
    powers: currentPool.powers
  })

  console.log(swapTxs)
}

testLocal()
