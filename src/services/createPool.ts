import { BigNumber, ethers } from 'ethers'
import { bn } from '../utils/helper'
import { UniV2Pair } from './uniV2Pair'
import { JsonRpcProvider } from '@ethersproject/providers'
import { PoolConfig } from '../types'
import { ConfigType } from './setConfig'
import { DerivableContractAddress } from '../utils/configs'
import {Profile} from "../profile";

// type ConfigType = {
//   account?: string
//   chainId: number
//   scanApi: string
//   provider: ethers.providers.Provider
//   overrideProvider: JsonRpcProvider
//   signer?: ethers.providers.JsonRpcSigner
//   UNIV2PAIR: UniV2Pair
// }

export class CreatePool {
  account?: string
  chainId: number
  scanApi?: string
  provider: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  signer?: ethers.providers.JsonRpcSigner
  UNIV2PAIR: UniV2Pair
  contractAddresses: Partial<DerivableContractAddress>
  profile: Profile

  constructor(config: ConfigType, profile: Profile) {
    this.account = config.account
    this.chainId = config.chainId
    this.scanApi = config.scanApi
    this.provider = config.provider
    this.overrideProvider = config.overrideProvider
    this.signer = config.signer
    this.contractAddresses = config.addresses
    this.profile = profile
  }

  async callStaticCreatePool({ params, value, gasLimit }: any) {
    const helper = this.getStateCalHelperContract(this.signer)
    return await helper.callStatic.createPool(
      params,
      this.contractAddresses.poolFactory,
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
        this.contractAddresses.poolFactory,
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
      utr: this.contractAddresses.router,
      token: this.contractAddresses.token,
      logic: this.contractAddresses.logic,
      oracle,
      reserveToken: this.contractAddresses.wrapToken,
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
      this.contractAddresses.stateCalHelper as string,
      this.profile.getAbi('Helper'),
      provider || this.provider,
    )
  }
}
