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

  const currentPool = Object.values(engine.RESOURCE.poolGroups)[0]
  engine.setCurrentPool({
    ...currentPool,
  })

  const poolOut = '0xC013eD851eF0f04c61cfb979f04e2e87BF54d57f'
  const provider = new ethers.providers.JsonRpcProvider(configs.rpcUrl)
  // @ts-ignore
  const tokenContract = new ethers.Contract( engine.config.addresses.token, TokenAbi, provider)
  const currentBalanceOut = await tokenContract.balanceOf(configs.account, packId(POOL_IDS.C.toString(), poolOut))
  const steps = [
    {
      amountIn: bn(numberToWei(0.0001)),
      tokenIn: NATIVE_ADDRESS,
      tokenOut: poolOut + '-' + POOL_IDS.C,
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
