import {ethers} from "ethers";
import PairDetailAbi from "./abi/PairDetail.json";
import {CONFIGS} from "./utils/configs";

const FLAG = '0x0000110000000000000000000000000000000000000000000000000000000111'

export const getPairInfo = async ({
                                    pairAddress,
                                    chainId,
                                    rpcUrl,
                                    flag = FLAG
                                  }: {
  pairAddress: string
  chainId: number
  rpcUrl: string
  flag?: string
}) => {
  try {
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl)
    const pairDetailContract = new ethers.Contract(CONFIGS[chainId].pairsInfo, PairDetailAbi, provider)

    const res = await pairDetailContract.functions.query([pairAddress], flag)
    return res.details[0]
  } catch (e) {
    console.error(e)
    return {}
  }
}

export const getPairsInfo = async (
  {
    pairAddresses,
    chainId,
    rpcUrl,
    flag = FLAG

  }: {
    flag?: string
    pairAddresses: string[]
    chainId: number
    rpcUrl: string
  }) => {
  try {
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl)
    const pairDetailContract = new ethers.Contract(CONFIGS[chainId].pairsInfo, PairDetailAbi, provider)

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
    console.error(e)
    return {}
  }
}
