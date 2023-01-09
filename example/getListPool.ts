import {DdlResource} from "../src/pools";

const test = async () => {
  let storageData = {}
  const pool = new DdlResource({
    chainId: 56,
    scanApi: 'https://api.bscscan.com/api',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    account: '0xC06F7cF8C9e8a8D39b0dF5A105d66127912Bc980',
    storage: {
      getItem: (itemName: string) => storageData[itemName],
      setItem: (itemName, value) => storageData[itemName] = value
    }
  })
  await pool.fetchResourceData()
  console.log({
    pools: pool.pools,
    tokens: pool.tokens,
    swapLogs: pool.swapLogs
  })
}

test()
