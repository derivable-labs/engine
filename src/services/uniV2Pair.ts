import { ethers } from 'ethers'
import PairDetailAbi from '../abi/PairDetail.json'
import {
  DEFAULT_CONFIG,
  DerivableContractAddress,
  config,
} from '../utils/configs'
import { Derivable } from '../../example/setConfig'

const FLAG =
  '0x0000110000000000000000000000000000000000000000000000000000000111'
type ConfigType = {
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
}

export class UniV2Pair {
  chainId: number
  scanApi?: string
  provider: ethers.providers.Provider
  addresses: Partial<DerivableContractAddress>

  constructor(account: string, config = DEFAULT_CONFIG) {
    const { chainId, scanApi, provider } = Derivable.loadConfig(account, config)
    this.addresses = Derivable.loadContract(config)
    this.chainId = chainId
    this.scanApi = scanApi
    this.provider = provider
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
        this.addresses.pairsInfo as string,
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
        this.addresses.pairsInfo as string,
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
