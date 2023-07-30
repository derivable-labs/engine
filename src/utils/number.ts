import { BigNumber, ethers } from 'ethers'
import { bn } from './helper'

export const FixedPoint = {
  Q128: bn('0x0100000000000000000000000000000000'), // 2**128
}

const packId = (kind: BigNumber, address: string) => {
  const k = bn(kind)
  return k.shl(160).add(address)
}

export const unpackId = (id: BigNumber) => {
  const k = ethers.utils.hexlify(id.shr(160))
  const p = ethers.utils.getAddress(
    ethers.utils.hexlify(id.mod(bn(1).shl(160))),
  )
  return { k, p }
}

function encodeSqrtX96(reserve1: number, reserve0: number) {
  return bn((Math.sqrt(reserve1 / reserve0) * 10 ** 12).toFixed(0))
    .mul(bn(2).pow(96))
    .div(10 ** 12)
}

const FLOAT_UNIT = 100000

export const floatToFixed128 = (n: number) => {
  return bn(n * FLOAT_UNIT)
    .shl(128)
    .div(FLOAT_UNIT)
}

export const fixed128ToFloat = (fixed128: BigNumber) => {
  return bn(fixed128).mul(FLOAT_UNIT).shr(128).toNumber() / FLOAT_UNIT
}
//
// export const formatFloat = (number: number | string, decimal = 4) => {
//   number = number.toString()
//   const arr = number.split('.')
//   if (arr.length > 1) {
//     arr[1] = arr[1].slice(0, decimal)
//   }
//   return arr.join('.')
// }
