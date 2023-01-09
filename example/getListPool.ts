import {DdlResource} from "../src/pools";

const test = async () => {
  const pool = new DdlResource({
    chainId: 56,
    scanApi: 'https://api.bscscan.com/api',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    account: '0xC06F7cF8C9e8a8D39b0dF5A105d66127912Bc980'
  })
  const res = await pool.intListPool()
  console.log(res)
}

test()
