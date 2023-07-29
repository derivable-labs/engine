import { Engine } from '../src/engine'
import {bn, numberToWei, packId} from '../src/utils/helper'
import { getTestConfigs } from './shared/testConfigs'
import { NATIVE_ADDRESS, POOL_IDS } from '../src/utils/constant'
import {ethers} from "ethers";
import TokenAbi from "../src/abi/Token.json";

const testLocal = async () => {
  const configs = getTestConfigs(42161)
  const engine = new Engine(configs.account, configs, 42161)
  await engine.RESOURCE.fetchResourceData(engine.account || '')

  const currentPool = Object.values(engine.RESOURCE.poolGroups)[0]
  engine.setCurrentPool({
    ...currentPool,
  })

  const poolOut = '0x1753310cCAbDaD0268b71acB99cA1a294e3A5942'
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
      useSweep: true,
      index_R: bn(ethers.utils.hexZeroPad(
        bn(1).shl(255)
          .add('0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443')
          .toHexString(),
        32,
      ))
    },
  ]

  await engine.SWAP.multiSwap(steps, bn(6000000)).catch((e) => {
    console.log(e)
  })
}

testLocal()
