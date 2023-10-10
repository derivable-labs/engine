import { ethers } from 'ethers'
import PairDetailAbi from '../abi/PairDetail.json'
import { IEngineConfig } from '../utils/configs'
import { Profile } from '../profile'
import { JsonRpcProvider } from '@ethersproject/providers'

const FLAG = '0x0000110000000000000000000000000000000000000000000000000000000111'
// type ConfigType = {
//   chainId: number
//   scanApi: string
//   provider: ethers.providers.Provider
// }

export class UniV2Pair {
  chainId: number
  scanApi?: string
  pairsInfoAddress: string
  provider: ethers.providers.Provider
  constructor(config: IEngineConfig, profile: Profile) {
    this.pairsInfoAddress = '0x' + PairDetailAbi.deployedBytecode.slice(-40)
    this.chainId = config.chainId
    this.scanApi = profile.configs.scanApi

    const provider = new JsonRpcProvider(profile.configs.rpc)
    // @ts-ignore
    provider.setStateOverride({
      [this.pairsInfoAddress]: {
        code: PairDetailAbi.deployedBytecode,
      },
    })

    this.provider = new JsonRpcProvider(profile.configs.rpc)
  }

  async getPairInfo({ pairAddress, flag = FLAG }: { pairAddress: string; flag?: string }) {
    try {
      const pairDetailContract = new ethers.Contract(this.pairsInfoAddress as string, PairDetailAbi.abi, this.provider)

      const res = await pairDetailContract.functions.query([pairAddress], flag)
      return res.details[0]
    } catch (e) {
      throw e
    }
  }

  async getPairsInfo({ pairAddresses, flag = FLAG }: { flag?: string; pairAddresses: string[] }) {
    try {
      const pairDetailContract = new ethers.Contract(this.pairsInfoAddress as string, PairDetailAbi.abi, this.provider)

      const { details } = await pairDetailContract.functions.query(pairAddresses, flag)
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
