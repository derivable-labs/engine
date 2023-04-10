import { BigNumber, ethers } from 'ethers'
import { UniV2Pair } from './uniV2Pair'
import { JsonRpcProvider } from '@ethersproject/providers'
import { PoolConfig } from '../types'
import { CONFIGS } from '../utils/configs'
import { LARGE_VALUE, ZERO_ADDRESS } from '../utils/constant'
import PoolFactoryAbi from '../abi/PoolFactory.json'
import UtrAbi from '../abi/UTR.json'
import WtapAbi from '../abi/Wrap.json'

const HALF_LIFE = 10 * 365 * 24 * 60 * 60
const AMOUNT_EXACT = 0
const TRANSFER_FROM_SENDER = 0
const bn = ethers.BigNumber.from

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
      const oracle = bn(1)
        .shl(255)
        .add(bn(300).shl(256 - 64))
        .add(CONFIGS[this.chainId].wrapUsdPair)
        .toHexString()
      const newPoolConfigs = {
        utr: CONFIGS[this.chainId].router,
        token: CONFIGS[this.chainId].token,
        logic: CONFIGS[this.chainId].logic,
        oracle,
        reserveToken: CONFIGS[this.chainId].wrapToken,
        recipient: params.recipient,
        mark: bn(38).shl(112),
        k: params.k,
        a: params.a,
        b: params.b,
        halfLife: HALF_LIFE, // ten years
      }
      const poolAddress = await poolFactoryContract.computePoolAddress(
        newPoolConfigs,
        {
          gasLimit: gasLimit || undefined,
        },
      )
      const utr = this.getRouterContract(this.signer)

      // const weth = new ethers.Contract(
      //   CONFIGS[this.chainId].wrapToken,
      //   WtapAbi,
      //   this.signer,
      // )
      // await weth.approve(CONFIGS[this.chainId].router, LARGE_VALUE)

      const res = await utr.exec(
        [],
        [
          {
            inputs: [
              {
                mode: TRANSFER_FROM_SENDER,
                eip: 20,
                token: CONFIGS[this.chainId].wrapToken,
                id: 0,
                amountSource: AMOUNT_EXACT,
                amountInMax: params.amountInit,
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

  getRouterContract(provider: any) {
    return new ethers.Contract(CONFIGS[this.chainId].router, UtrAbi, provider)
  }
  getPoolFactoryContract(provider: any) {
    return new ethers.Contract(
      CONFIGS[this.chainId].poolFactory,
      PoolFactoryAbi,
      provider,
    )
  }
}
