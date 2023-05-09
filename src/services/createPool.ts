import { BigNumber, ethers } from 'ethers'
import { UniV2Pair } from './uniV2Pair'
import { JsonRpcProvider } from '@ethersproject/providers'
import { PoolConfig } from '../types'
import { DEFAULT_CONFIG, DerivableContractAddress } from '../utils/configs'
import PoolFactoryAbi from '../abi/PoolFactory.json'
import { Derivable } from '../../example/setConfig'

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
  contractAddress: DerivableContractAddress

  constructor(account: string, config = DEFAULT_CONFIG) {
    if (
      !config.chainId ||
      !account ||
      !config.rpcToGetLogs ||
      !config.scanApi ||
      !config.rpcUrl
    ) {
      throw new Error(`required ChainId Account RPC ScanApi to be defined!`)
    }

    if (
      !config.addresses.multiCall ||
      !config.addresses.bnA ||
      !config.addresses.router ||
      !config.addresses.token
    ) {
      throw new Error(
        `required multiCall bnA router token contract address to be defined!`,
      )
    }

    const { chainId, scanApi, provider, overrideProvider, signer } =
      Derivable.loadConfig(account, config)
    const contractAddress = Derivable.loadContract(config)
    this.account = account
    this.chainId = chainId
    this.scanApi = scanApi
    this.provider = provider
    this.overrideProvider = overrideProvider
    this.signer = signer
    this.contractAddress = contractAddress
  }

  encodePowers(powers: any) {
    let powersBytes = []
    for (let i = powers.length - 1; i >= 0; --i) {
      let power = powers[i]
      if (power < 0) {
        power = 0x8000 - power
      }
      powersBytes.push(...ethers.utils.zeroPad(power, 2))
    }
    const encoded =
      ethers.utils.hexZeroPad(powers.length, 2) +
      ethers.utils.hexZeroPad(powersBytes, 30).slice(2)
    return encoded
  }

  async createPool(params: PoolConfig, gasLimit?: BigNumber) {
    try {
      const poolFactoryContract = new ethers.Contract(
        this.contractAddress.poolFactory,
        PoolFactoryAbi,
        this.signer,
      )
      const newPoolConfigs = {
        UTR: this.contractAddress.router,
        // logic: config.logic, What variable means?
        pairToken: this.contractAddress.wrapUsdPair,
        baseToken: this.contractAddress.wrapToken,
        priceToleranceRatio: params.priceToleranceRatio,
        rentRate: params.rentRate,
        deleverageRate: params.deleverageRate,
        powers: this.encodePowers(params.powers),
        feeRecipient: this.account,
        feeDenominator: 33,
      }
      const res = await poolFactoryContract.createPool(newPoolConfigs, {
        gasLimit: gasLimit || undefined,
      })
      const tx = await res.wait(1)
      console.log('tx', tx)
      return true
    } catch (e) {
      throw e
    }
  }
}
