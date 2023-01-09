import {ethers} from 'ethers'
import {ADDRESSES} from "./addresses";
import PairDetailAbi from "../abi/PairDetail.json";
import {provider} from "./helper";

export const getPairInfo = async (chainId: number, pairAddress: any) => {
  try {
    const pairDetailContract = new ethers.Contract(ADDRESSES[chainId].pairsInfo, PairDetailAbi, provider)
    const res = await pairDetailContract.functions.query(
      [pairAddress],
      '0x0000110000000000000000000000000000000000000000000000000000000111'
    )
    console.log(res)
    return res.details[0]
  } catch (e) {
    // console.error(e)
    return {}
  }
}

export const getPairsInfo = async (chainId: number, pairAddresses: any) => {
  try {
    const pairDetailContract = new ethers.Contract(ADDRESSES[chainId].pairsInfo, PairDetailAbi, provider)
    const { details } = await pairDetailContract.functions.query(
      pairAddresses,
      '0x0000110000000000000000000000000000000000000000000000000000000111'
    )
    const result = {}
    for (let i = 0; i < pairAddresses.length; i++) {
      result[pairAddresses[i]] = details[i]
    }
    return result
  } catch (e) {
    // console.error(e)
    return {}
  }
}
