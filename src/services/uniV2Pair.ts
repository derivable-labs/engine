import { ethers } from 'ethers'
import PairDetailAbi from '../abi/PairDetail.json'
import { CONFIGS } from '../utils/configs'

const FLAG =
  '0x0000110000000000000000000000000000000000000000000000000000000111'
type ConfigType = {
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
}

export class UniV2Pair {
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
    flag = FLAG,
  }: {
    pairAddress: string
    flag?: string
  }) {
    try {
      const pairDetailContract = new ethers.Contract(
        CONFIGS[this.chainId].pairsInfo,
        PairDetailAbi,
        this.provider,
      )

      const res = await pairDetailContract.functions.query([pairAddress], flag)
      return res.details[0]
    } catch (e) {
      throw e
    }
  }

  async getPairsInfo({
    pairAddresses,
    flag = FLAG,
  }: {
    flag?: string
    pairAddresses: string[]
  }) {
    try {
      const pairDetailContract = new ethers.Contract(
        CONFIGS[this.chainId].pairsInfo,
        PairDetailAbi,
        this.provider,
      )

      const { details } = await pairDetailContract.functions.query(
        pairAddresses,
        flag,
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
