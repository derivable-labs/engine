import { ethers } from 'ethers'
import PairV3DetailAbi from '../abi/PairV3Detail.json'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ConfigType } from './setConfig'

const FLAG =
  '0x0000110000000000000000000000000000000000000000000000000000000111'
// type ConfigType = {
//   chainId: number
//   scanApi: string
//   provider: ethers.providers.Provider
//   rpcUrl: string
// }

export class UniV3Pair {
  chainId: number
  scanApi?: string
  provider: ethers.providers.Provider
  rpcUrl: string
  pairsV3Info: string

  constructor(config: ConfigType) {
    const { chainId, scanApi, provider, rpcUrl } = config
    const { pairsV3Info } = config.addresses
    if (!pairsV3Info) {
      throw new Error(`required pairsV3Info contract to be defined!`)
    }
    this.chainId = chainId
    this.scanApi = scanApi
    this.provider = provider
    this.rpcUrl = rpcUrl
    this.pairsV3Info = pairsV3Info
  }

  async getPairInfo({
    pairAddress,
    flag = FLAG,
  }: {
    pairAddress: string
    flag?: string
  }) {
    try {
      const provider = new JsonRpcProvider(this.rpcUrl)
      // @ts-ignore
      provider.setStateOverride({
        [this.pairsV3Info]: {
          code: PairV3DetailAbi.deployedBytecode,
        },
      })

      const pairDetailContract = new ethers.Contract(
        this.pairsV3Info,
        PairV3DetailAbi.abi,
        provider,
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
      const provider = new JsonRpcProvider(this.rpcUrl)
      // @ts-ignore
      provider.setStateOverride({
        [this.pairsV3Info]: {
          code: PairV3DetailAbi.deployedBytecode,
        },
      })

      const pairDetailContract = new ethers.Contract(
        this.pairsV3Info,
        PairV3DetailAbi.abi,
        provider,
      )

      const { details } = await pairDetailContract.functions.query(
        pairAddresses,
        flag,
      )
      const result = {}
      for (let i = 0; i < pairAddresses.length; i++) {
        result[pairAddresses[i]] = {
          token0: {
            address: details[i].token0.adr,
            name: details[i].token0.name,
            symbol: details[i].token0.symbol,
            decimal: details[i].token0.decimals.toNumber(),
          },
          token1: {
            address: details[i].token1.adr,
            name: details[i].token1.name,
            symbol: details[i].token1.symbol,
            decimal: details[i].token1.decimals.toNumber(),
          },
        }
      }
      return result
    } catch (e) {
      throw e
    }
  }
}
