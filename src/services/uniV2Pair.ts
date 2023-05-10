import { ethers } from 'ethers'
import PairDetailAbi from '../abi/PairDetail.json'
import { DerivableContractAddress } from '../utils/configs'
import { ConfigType } from './setConfig'

const FLAG =
  '0x0000110000000000000000000000000000000000000000000000000000000111'
// type ConfigType = {
//   chainId: number
//   scanApi: string
//   provider: ethers.providers.Provider
// }

export class UniV2Pair {
  chainId: number
  scanApi?: string
  provider: ethers.providers.Provider
  constractAddresses: Partial<DerivableContractAddress>
  constructor(config: ConfigType) {
    const {chainId, scanApi, provider} = config;
    this.constractAddresses = config.addresses;
    this.chainId = chainId;
    this.scanApi = scanApi;
    this.provider = provider;
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
        this.constractAddresses.pairsInfo as string,
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
        this.constractAddresses.pairsInfo as string,
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
