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

  async createPool(params: PoolConfig, gasLimit?: BigNumber) {
    try {
      const poolFactoryContract = new ethers.Contract(CONFIGS[this.chainId].poolFactory, PoolFactoryAbi, this.signer)
      const compiledWETH = require("canonical-weth/build/contracts/WETH9.json")
      const weth = new ethers.Contract(CONFIGS[this.chainId].wrapToken, compiledWETH.abi, this.signer)
      weth.transfer(CONFIGS[this.chainId].poolFactory, ethers.utils.parseEther("10"))
      
      const newPoolConfigs = {
        logic: CONFIGS[this.chainId].logic,
        tokenOracle: CONFIGS[this.chainId].wrapUsdPair,
        tokenCollateral: CONFIGS[this.chainId].wrapToken,
        recipient: params.recipient,
        markPrice: params.markPrice,
        power: params.power,
        a: params.a,
        b: params.b
      }
      const poolAddress = await poolFactoryContract.computePoolAddress(newPoolConfigs)
      const res1 = await weth.transfer(poolAddress, ethers.utils.parseEther("10"),{
        gasLimit: gasLimit || undefined
      })
      await res1.wait(1)
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
