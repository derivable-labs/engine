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

  const poolOut = '0xAEAA6C357d3cb5050d5f77C7902cE50e221e669f'
  const provider = new ethers.providers.JsonRpcProvider(configs.rpcUrl)
  // @ts-ignore
  const tokenContract = new ethers.Contract( engine.config.addresses.token, TokenAbi, provider)
  const currentBalanceOut = await tokenContract.balanceOf(configs.account, packId(POOL_IDS.C.toString(), poolOut))
  const steps = [
    {
      amountIn: bn(numberToWei(0.001)),
      tokenIn: NATIVE_ADDRESS,
      tokenOut: poolOut + '-' + POOL_IDS.C,
      amountOutMin: 0,
      currentBalanceOut,
      useSweep: false,
      index_R: bn(ethers.utils.hexZeroPad(
        bn(1).shl(255)
          .add('0x4C36388bE6F416A29C8d8Eee81C771cE6bE14B18')
          .toHexString(),
        32,
      ))
    },
  ]

  try {
    const res = await engine.SWAP.calculateAmountOuts(steps)
    console.log(res)
  } catch (e) {
    console.log(e)
  }

}

testLocal()
