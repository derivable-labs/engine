import { ethers } from 'ethers'
import { Engine } from '../../src/engine'
import { bn, numberToWei, packId } from '../../src/utils/helper'
import { NATIVE_ADDRESS, POOL_IDS } from '../../src/utils/constant'
import { TestConfiguration } from '../shared/configurations/configurations'
import TokenAbi from '../../src/abi/Token.json'

const conf = new TestConfiguration()

export const calcAmountOuts = async (chainId: number, poolAddresses: Array<string>, amountIn: number): Promise<number | undefined> => {
  try {
    const configs = conf.get(chainId)
    const engine = new Engine(configs)
    await engine.initServices()
    await engine.RESOURCE.fetchResourceData(poolAddresses, configs.account)

    const currentPool = engine.RESOURCE.pools[poolAddresses[0]]
    engine.setCurrentPool({
      ...currentPool,
    })

    const poolOut = currentPool.poolAddress
    const provider = new ethers.providers.JsonRpcProvider(engine.profile.configs.rpc)

    const tokenContract = new ethers.Contract(engine.profile.configs.derivable.token, TokenAbi, provider)
    const currentBalanceOut = await tokenContract.balanceOf(configs.account, packId(POOL_IDS.C.toString(), poolOut))
    const steps = [
      {
        amountIn: bn(numberToWei(amountIn, 6)),
        tokenIn: NATIVE_ADDRESS,
        tokenOut: poolOut + '-' + POOL_IDS.C,
        amountOutMin: 0,
        currentBalanceOut,
        useSweep: true,
      },
    ]

    const fetcherV2 = await engine.SWAP.needToSubmitFetcher(currentPool)
    const params: any = {
      steps,
      fetcherV2,
    }
    if (fetcherV2) {
      params.fetcherData = await engine.SWAP.fetchPriceMockTx(currentPool)
    }
    const [res, gasLeft] = await engine.SWAP.calculateAmountOuts(params)
    return res[res.length - 1].amountOut
  } catch (error) {
    return undefined
  }
}
