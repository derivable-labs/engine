import { ethers } from 'ethers'
import { Engine } from '../../src/engine'
import { TestConfiguration } from '../shared/configurations/configurations'
import TokenAbi from '../../src/abi/Token.json'
import { bn, numberToWei, packId } from '../../src/utils/helper'
import { NATIVE_ADDRESS, POOL_IDS } from '../../src/utils/constant'

const conf = new TestConfiguration()

export const swap = async (
  chainId: number,
  poolAddresses: Array<string>,
  poolAddress: string,
  amount: number,
): Promise<any | undefined> => {
  try {
    const configs = conf.get(chainId)
    const engine = new Engine(configs)
    await engine.initServices()
    await engine.RESOURCE.fetchResourceData(poolAddresses, configs.account)

    const currentPool = engine.RESOURCE.pools[poolAddress]
    engine.setCurrentPool({
      ...currentPool,
    })

    const poolOut = currentPool.poolAddress
    const provider = new ethers.providers.JsonRpcProvider(engine.profile.configs.rpc)

    const tokenContract = new ethers.Contract(engine.profile.configs.derivable.token, TokenAbi, provider)
    const currentBalanceOut = await tokenContract.balanceOf(configs.account, packId(POOL_IDS.C.toString(), poolOut))
    const steps = [
      {
        amountIn: bn(numberToWei(amount, 6)),
        tokenIn: NATIVE_ADDRESS,
        tokenOut: poolOut + '-' + POOL_IDS.C,
        amountOutMin: 0,
        currentBalanceOut,
        useSweep: true,
      },
    ]

    const fetcherV2 = await engine.SWAP.needToSubmitFetcher(currentPool)
    const fetcherData = await engine.SWAP.fetchPriceTx(currentPool)
    const res = await engine.SWAP.multiSwap({
      fetcherData,
      submitFetcherV2: fetcherV2,
      steps,
      gasLimit: bn(2000000),
      gasPrice: bn(3e9),
    })
    return res
  } catch (error) {
    return undefined
  }
}
