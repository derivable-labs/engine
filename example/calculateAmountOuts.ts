import {Engine} from '../src/engine'
import {bn, numberToWei, packId} from '../src/utils/helper'
import {getTestConfigs} from './shared/testConfigs'
import {NATIVE_ADDRESS, POOL_IDS} from '../src/utils/constant'
import TokenAbi from '../src/abi/Token.json'
import {ethers} from "ethers";

const testLocal = async () => {
  const configs = getTestConfigs(8453)
  const engine = new Engine(configs)
  await engine.initServices()
  await engine.RESOURCE.fetchResourceData(configs.account)

  const currentPool = engine.RESOURCE.poolGroups['0x9E37cb775a047Ae99FC5A24dDED834127c4180cD']
  engine.setCurrentPool({
    ...currentPool,
  })

  const poolOut = '0xF9afc64E5Dde15E941e2C01dd848b2EC67FD08b8'
  const provider = new ethers.providers.JsonRpcProvider(configs.rpcUrl)
  // @ts-ignore
  const tokenContract = new ethers.Contract( engine.profile.configs.derivable.token, TokenAbi, provider)
  const currentBalanceOut = await tokenContract.balanceOf(configs.account, packId(POOL_IDS.C.toString(), poolOut))
  const steps = [
    {
      amountIn: bn(numberToWei(0.01, 6)),
      tokenIn: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
      tokenOut: poolOut + '-' + POOL_IDS.C,
      amountOutMin: 0,
      currentBalanceOut,
      useSweep: false
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
