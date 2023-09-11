import {Engine} from '../src/engine'
import {bn, numberToWei, packId} from '../src/utils/helper'
import {getTestConfigs} from './shared/testConfigs'
import {NATIVE_ADDRESS, POOL_IDS} from '../src/utils/constant'
import TokenAbi from '../src/abi/Token.json'
import {ethers} from "ethers";

const testLocal = async () => {
  const configs = getTestConfigs(8453)
  const engine = new Engine(configs.account, configs, 8453)
  await engine.RESOURCE.fetchResourceData(configs.account)

  const currentPool = engine.RESOURCE.poolGroups['0x9E37cb775a047Ae99FC5A24dDED834127c4180cD']
  engine.setCurrentPool({
    ...currentPool,
  })

  const usdc = '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca'
  const poolOut = '0x44C46037AD3621f95a488d898c1e9CFDa0F58e95'
  const provider = new ethers.providers.JsonRpcProvider(configs.rpcUrl)
  // @ts-ignore
  const tokenContract = new ethers.Contract( engine.config.addresses.token, TokenAbi, provider)
  const currentBalanceOut = await tokenContract.balanceOf(configs.account, packId(POOL_IDS.A.toString(), poolOut))
  const steps = [
    {
      uniPool: '0x4C36388bE6F416A29C8d8Eee81C771cE6bE14B18',
      amountIn: bn('1000000000000000'),
      payloadAmountIn: bn('0x038d7ea4c68000'),
      tokenIn: poolOut + '-' + POOL_IDS.A,
      tokenOut: usdc,
      amountOutMin: 0,
      currentBalanceOut,
      useSweep: false,
      index_R: bn(0)
    },
  ]
  // 961641740797182
  // 963138663855440
  // 976192888021539
  // 979755377489193
  // 982100493385779
  try {
    const res = await engine.SWAP.calculateAmountOuts(steps)
    console.log(res[0][0].amountOut.toString())
    console.log(res)
  } catch (e) {
    console.log(e)
  }
}

testLocal()
