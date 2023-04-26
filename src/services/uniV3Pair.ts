import {ethers}      from "ethers";
import PairV3DetailAbi from "../abi/PairV3Detail.json";
import {CONFIGS}     from "../utils/configs";

const FLAG = '0x00001100000000000000000000000000000000000000000000000001111'
// const FLAG = '0x10000000000000000000000000000000000000000000000000000000000'
type ConfigType = {
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
}

export class UniV3Pair {
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider

  constructor(configs: ConfigType) {
    this.chainId = configs.chainId
    this.scanApi = configs.scanApi
    this.provider = configs.provider
  }

  async getPairInfo({
    pairAddress,
    flag = FLAG
  }: {
    pairAddress: string
    flag?: string
  }) {
    try {
      const pairDetailContract = new ethers.Contract(CONFIGS[this.chainId].pairsInfo, PairV3DetailAbi, this.provider)

      const res = await pairDetailContract.functions.query([pairAddress], flag)
      return res.details[0]
    } catch (e) {
      throw e
    }
  }

  async getPairsInfo(
    {
      pairAddresses,
      flag = FLAG
    }: {
      flag?: string
      pairAddresses: string[]
    }) {
    try {
      const pairDetailContract = new ethers.Contract(CONFIGS[this.chainId].pairsV3Info, PairV3DetailAbi, this.provider)

      const { details } = await pairDetailContract.functions.query(
        pairAddresses,
        flag
      )
      const result = {}
      for (let i = 0; i < pairAddresses.length; i++) {
        result[pairAddresses[i]] = details[i]
      }
      return result
    } catch (e) {
      throw e
    }
  }
}
