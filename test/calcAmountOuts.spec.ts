import { Engine } from '../src/engine'
import { bn, numberToWei, packId } from '../src/utils/helper'
import { getTestConfigs } from './shared/configurations/configuration.spec'
import { NATIVE_ADDRESS, POOL_IDS } from '../src/utils/constant'
import TokenAbi from '../src/abi/Token.json'
import { ethers } from 'ethers'
import { interceptorUtils } from './shared/libs/interceptor.spec'

interceptorUtils()

export const calcAmountOuts = async () => {
  const configs = getTestConfigs(42161)
  const engine = new Engine(configs)
  await engine.initServices()
  await engine.RESOURCE.fetchResourceData(['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'], configs.account)

  const currentPool = engine.RESOURCE.pools['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96']
  engine.setCurrentPool({
    ...currentPool,
  })

  const poolOut = currentPool.poolAddress
  const provider = new ethers.providers.JsonRpcProvider(engine.profile.configs.rpc)
  // @ts-ignore
  const tokenContract = new ethers.Contract(engine.profile.configs.derivable.token, TokenAbi, provider)
  const currentBalanceOut = await tokenContract.balanceOf(configs.account, packId(POOL_IDS.C.toString(), poolOut))
  const steps = [
    {
      amountIn: bn(numberToWei(0.01, 6)),
      tokenIn: NATIVE_ADDRESS,
      tokenOut: poolOut + '-' + POOL_IDS.C,
      amountOutMin: 0,
      currentBalanceOut,
      useSweep: true,
    },
  ]

  try {
    const fetcherV2 = await engine.SWAP.needToSubmitFetcher(currentPool)
    const params: any = {
      steps,
      fetcherV2,
    }
    if (fetcherV2) {
      params.fetcherData = await engine.SWAP.fetchPriceMockTx(currentPool)
    }
    const [res, gasLeft] = await engine.SWAP.calculateAmountOuts(params)
    console.log('gasLeft', gasLeft.toNumber())
    console.log(res[res.length - 1].amountOut.toString())
    console.log(...res)
  } catch (e) {
    console.log(e)
  }
}
