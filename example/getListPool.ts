import {Engine}   from "../src/engine";
import {ethers}      from "ethers";

const test = async () => {
  let storageData = {}
  const engine = new Engine({
    chainId: 42161,
    scanApi: 'https://api.arbiscan.io/api',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    account: '0xC06F7cF8C9e8a8D39b0dF5A105d66127912Bc980',
    provider: new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc"),
    providerToGetLog: new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc'),
    storage: {
      //@ts-ignore
      getItem: (a) => {return ''},
      //@ts-ignore
      setItem: (a, b) => {},
    }
  })
  const res = await engine.RESOURCE.fetchResourceData('0xC06F7cF8C9e8a8D39b0dF5A105d66127912Bc980')
  console.log({
    pools: engine.RESOURCE.pools,
    tokens: engine.RESOURCE.tokens,
    swapLogs: engine.RESOURCE.swapLogs
  })

}

test()
