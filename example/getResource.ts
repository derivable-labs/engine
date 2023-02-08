import {Engine} from "../src/engine";
import {ethers} from "ethers";

const testBSC = async () => {
  let storageData = {}
  const engine = new Engine({
    chainId: 56,
    scanApi: 'https://api.bscscan.com/api',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    account: '0xC06F7cF8C9e8a8D39b0dF5A105d66127912Bc980',
    provider: new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/"),
    providerToGetLog: new ethers.providers.JsonRpcProvider('https://bscrpc.com/'),
    storage: {
      getItem: (key) => {
        return storageData[key]
      },
      setItem: (key, value) => {
        storageData[key] = value
      }
    }
  })
  const res = await engine.RESOURCE.fetchResourceData('0xC06F7cF8C9e8a8D39b0dF5A105d66127912Bc980')
  console.log({
    pools: engine.RESOURCE.pools,
    tokens: engine.RESOURCE.tokens,
    swapLogs: engine.RESOURCE.swapLogs
  })

}

const testLocal = async () => {
  let storageData = {}
  const engine = new Engine({
    chainId: 31337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545/',
    account: '0x704cF59B16Fd50Efd575342B46Ce9C5e07076A4a',
    provider: new ethers.providers.JsonRpcProvider("http://localhost:8545"),
    providerToGetLog: new ethers.providers.JsonRpcProvider('http://localhost:8545/'),
    storage: {
      getItem: (key) => {
        return storageData[key]
      },
      setItem: (key, value) => {
        storageData[key] = value
      }
    }
  })
  await engine.RESOURCE.fetchResourceData('0x704cF59B16Fd50Efd575342B46Ce9C5e07076A4a')
  // console.log({
  //   pools: engine.RESOURCE.pools,
  //   tokens: engine.RESOURCE.tokens,
  //   swapLogs: engine.RESOURCE.swapLogs
  // })

  engine.RESOURCE.getNewResource('').then((data: any) => {
    console.log(data)
  })
}

testLocal()
