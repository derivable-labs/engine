import { BigNumber, ethers } from 'ethers'
import { UniV2Pair } from './uniV2Pair'
import { JsonRpcProvider } from '@ethersproject/providers'
import { PoolConfig } from '../types'
import { CONFIGS } from '../utils/configs'
import { ZERO_ADDRESS } from '../utils/constant'
import PoolFactoryAbi from '../abi/PoolFactory.json'
import UtrAbi from '../abi/UTR.json'
import WtapAbi from '../abi/Wrap.json'

// utr
const FROM_ROUTER = 10
const PAYMENT = 0
const TRANSFER = 1
const ALLOWANCE = 2
const CALL_VALUE = 3

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

  async createPool(params: PoolConfig, gasLimit?: BigNumber) {
    try {
      const poolFactoryContract = this.getPoolFactoryContract(this.signer)
      const wrapToken = this.getWrapTokenContract(this.signer)
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
      const poolAddress = await poolFactoryContract.computePoolAddress(
        newPoolConfigs
      )
      const utr = this.getRouterContract(this.signer)
      const res = await utr.exec(
        [],
        [
          {
            inputs: [
              {
                mode: CALL_VALUE,
                eip: 0,
                token: ZERO_ADDRESS,
                id: 0,
                amountIn: params.amountInit,
                recipient: ZERO_ADDRESS,
              },
            ],
            flags: 0,
            code: CONFIGS[this.chainId].wrapToken,
            data: (await wrapToken.populateTransaction.deposit()).data,
          },
          {
            inputs: [
              {
                mode: TRANSFER + FROM_ROUTER,
                eip: 20,
                token: CONFIGS[this.chainId].wrapToken,
                id: 0,
                amountIn: 0,
                recipient: poolAddress,
              },
            ],
            flags: 0,
            code: CONFIGS[this.chainId].poolFactory,
            data: (
              await poolFactoryContract.populateTransaction.createPool(
                newPoolConfigs,
              )
            ).data,
          },
        ],
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

  getRouterContract(provider: any) {
    return new ethers.Contract(CONFIGS[this.chainId].router, UtrAbi, provider)
  }
  getWrapTokenContract(provider: any) {
    return new ethers.Contract(
      CONFIGS[this.chainId].wrapToken,
      WtapAbi,
      provider,
    )
  }
  getPoolFactoryContract(provider: any) {
    return new ethers.Contract(
      CONFIGS[this.chainId].poolFactory,
      PoolFactoryAbi,
      provider,
    )
  }
}
