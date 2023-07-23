import {Engine} from '../src/engine'
import {bn, numberToWei, packId} from '../src/utils/helper'
import {getTestConfigs} from './shared/testConfigs'
import {NATIVE_ADDRESS, POOL_IDS} from '../src/utils/constant'
import TokenAbi from '../src/abi/Token.json'
import {ethers} from "ethers";

const testLocal = async () => {
  const configs = getTestConfigs(42161)
  const engine = new Engine(configs.account, configs, 42161)
  await engine.RESOURCE.fetchResourceData(configs.account)

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
      useSweep: true
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
