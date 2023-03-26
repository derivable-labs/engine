import {BigNumber, ethers} from "ethers";
import {bn} from "./helper";

export const FixedPoint = {
  Q112: bn('0x10000000000000000000000000000') // 2**112
}

const packId = (kind: BigNumber, address: string) => {
  const k = bn(kind)
  return k.shl(160).add(address)
}

const unpackId = (id: BigNumber) => {
  const k = ethers.utils.hexlify(id.shr(160))
  const p = ethers.utils.getAddress(ethers.utils.hexlify(id.mod(bn(1).shl(160))))
  return {k, p}
}

function encodeSqrtX96(reserve1: number, reserve0: number) {
  return bn((Math.sqrt(reserve1 / reserve0) * 10 ** 12).toFixed(0))
    .mul(bn(2).pow(96))
    .div(10 ** 12)
}

const FLOAT_UNIT = 100000

export const floatToFixed112 = (n: number) => {
  return bn(n * FLOAT_UNIT).shl(112).div(FLOAT_UNIT)
}

export const fixed112ToFloat = (fixed112: BigNumber) => {
  return bn(fixed112).mul(FLOAT_UNIT).shr(112).toNumber() / FLOAT_UNIT
}