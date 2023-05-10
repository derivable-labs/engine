import { BigNumber, ethers } from 'ethers'
import { bn } from '../utils/helper'
import { UniV2Pair } from './uniV2Pair'
import { JsonRpcProvider } from '@ethersproject/providers'
import { PoolConfig } from '../types'
import { CONFIGS } from '../utils/configs'
import HelperAbi from '../abi/Helper.json'

type ConfigType = {
  account?: string
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  signer?: ethers.providers.JsonRpcSigner
  UNIV2PAIR: UniV2Pair
}

export class CreatePool {
  account?: string
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  signer?: ethers.providers.JsonRpcSigner
  UNIV2PAIR: UniV2Pair

  constructor(configs: ConfigType) {
    this.account = configs.account
    this.chainId = configs.chainId
    this.scanApi = configs.scanApi
    this.provider = configs.provider
    this.overrideProvider = configs.overrideProvider
    this.signer = configs.signer
  }

  async callStaticCreatePool({ params, value, gasLimit }: any) {
    const helper = this.getStateCalHelperContract(this.signer)
    return await helper.callStatic.createPool(
      params,
      CONFIGS[this.chainId].poolFactory,
      { value: value || bn(0), gasLimit: gasLimit || undefined },
    )
  }

  async createPool(params: PoolConfig, gasLimit?: BigNumber) {
    try {
      const newPoolConfigs = this.generateConfig(
        params.k,
        params.a,
        params.b,
        params.mark,
        params.recipient,
        params.oracle,
        params.initTime,
        params.halfLife,
      )
      await this.callStaticCreatePool({
        params: newPoolConfigs,
        value: params.amountInit,
        gasLimit,
      })
      const helper = this.getStateCalHelperContract(this.signer)
      const res = await helper.createPool(
        newPoolConfigs,
        CONFIGS[this.chainId].poolFactory,
        {
          value: params.amountInit,
          gasLimit: gasLimit || undefined,
        },
      )
      const tx = await res.wait(1)
      console.log('tx', tx)
      return true
    } catch (e) {
      throw e
    }
  }

  generateConfig(
    k: number,
    a: BigNumber,
    b: BigNumber,
    mark: BigNumber,
    recipient: string,
    oracle: string,
    initTime: number,
    halfLife: number,
  ) {
    return {
      utr: CONFIGS[this.chainId].router,
      token: CONFIGS[this.chainId].token,
      logic: CONFIGS[this.chainId].logic,
      oracle,
      reserveToken: CONFIGS[this.chainId].wrapToken,
      recipient,
      mark,
      k,
      a,
      b,
      initTime,
      halfLife,
    }
  }

  getStateCalHelperContract(provider?: any) {
    return new ethers.Contract(
      CONFIGS[this.chainId].stateCalHelper,
      HelperAbi,
      provider || this.provider,
    )
  }
}
