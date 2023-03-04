import {BigNumber, ethers} from "ethers";
import {UniV2Pair} from "./uniV2Pair";
import {JsonRpcProvider} from "@ethersproject/providers";
import {PoolConfig} from "../types";
import {CONFIGS} from "../utils/configs";
import PoolFactoryAbi from "../abi/PoolFactory.json"

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

  encodePowers(powers: any) {
    let powersBytes = []
    for (let i = powers.length-1; i >= 0; --i) {
        let power = powers[i]
        if (power < 0) {
            power = 0x8000 - power
        }
        powersBytes.push(...ethers.utils.zeroPad(power, 2))
    }
    const encoded = ethers.utils.hexZeroPad(powers.length, 2) + ethers.utils.hexZeroPad(powersBytes, 30).slice(2)
    return encoded
  }

  async createPool(params: PoolConfig, gasLimit?: BigNumber) {
    try {
      const poolFactoryContract = new ethers.Contract(CONFIGS[this.chainId].poolFactory, PoolFactoryAbi, this.signer)
      const newPoolConfigs = {
        UTR: CONFIGS[this.chainId].router,
        logic: CONFIGS[this.chainId].logic,
        pairToken: CONFIGS[this.chainId].wrapUsdPair,
        baseToken: CONFIGS[this.chainId].wrapToken,
        priceToleranceRatio: params.priceToleranceRatio,
        rentRate: params.rentRate,
        deleverageRate: params.deleverageRate,
        powers: this.encodePowers(params.powers),
        feeRecipient: this.account,
        feeDenominator: 33,
      }
      const res = await poolFactoryContract.createPool(newPoolConfigs,
        {
          gasLimit: gasLimit || undefined
        }
      )
      const tx = await res.wait(1)
      console.log('tx', tx)
      return true
    } catch (e) {
      throw e
    }
  }
}
