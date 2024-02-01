import { ethers } from 'ethers'
import { Engine } from '../../src/engine'
import TokenAbi from '../../src/abi/Token.json'
import { bn, numberToWei, packId } from '../../src/utils/helper'
import { NATIVE_ADDRESS, POOL_IDS } from '../../src/utils/constant'
import { IEngineConfig } from '../../src/utils/configs'

export const swap = async (
  configs: IEngineConfig,
  poolAddresses: Array<string>,
  poolAddress: string,
  amount: number,
): Promise<any> => {
  const engine = new Engine(configs)
  await engine.initServices()
  await engine.RESOURCE.fetchResourceData(poolAddresses, configs.account!)

  const currentPool = engine.RESOURCE.pools[poolAddress]
  engine.setCurrentPool({
    ...currentPool,
  })

  const poolOut = currentPool.poolAddress
  const provider = engine.RESOURCE.provider

  const jsonHelper = require('../../../derivable-core/artifacts/contracts/support/Helper.sol/Helper.json')
  provider.setStateOverride({
    [engine.profile.configs.derivable.stateCalHelper]: {
      code: jsonHelper.deployedBytecode,
    }
  })

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
    callStatic: true,
  })
  return res
}
