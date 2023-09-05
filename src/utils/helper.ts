import {BigNumber, ethers, utils} from 'ethers'
import {TokenType} from '../types'
import EventsAbi from "../abi/Events.json";
import {SECONDS_PER_DAY} from "./constant";

export const provider = new ethers.providers.JsonRpcProvider(
  'https://bsc-dataseed.binance.org/',
)

export const bn = BigNumber.from

export const weiToNumber = (wei: any, decimal: number = 18) => {
  if (!wei || !Number(wei)) return '0'
  wei = wei.toString()
  return utils.formatUnits(wei, decimal)
}

export const numberToWei = (number: any, decimal: number = 18) => {
  number = number.toString()

  const arr = number.split('.')
  if (arr[1] && arr[1].length > decimal) {
    arr[1] = arr[1].slice(0, decimal)
    number = arr.join('.')
  }

  return utils.parseUnits(number, decimal).toString()
}

export const decodePowers = (powersBytes: string) => {
  powersBytes = powersBytes.slice(6)
  const raws: any = powersBytes.match(/.{1,4}/g)
  const powers = []
  for (let i = raws.length - 1; i >= 0; --i) {
    let power = Number('0x' + raws[i])
    if (power > 0x8000) {
      power = 0x8000 - power
    }
    if (power !== 0) {
      powers.push(power)
    }
  }
  return powers
}

export const formatMultiCallBignumber = (data: any) => {
  return data.map((item: any) => {
    if (item.type === 'BigNumber') {
      item = bn(item.hex)
    }

    if (Array.isArray(item)) {
      item = formatMultiCallBignumber(item)
    }
    return item
  })
}

export const getErc1155Token = (addresses: string[]) => {
  const erc1155Addresses = addresses.filter(isErc1155Address)
  const result = {}
  for (let i = 0; i < erc1155Addresses.length; i++) {
    const address = erc1155Addresses[i].split('-')[0]
    const id = erc1155Addresses[i].split('-')[1]
    if (!result[address]) {
      result[address] = [bn(id)]
    } else {
      result[address].push(bn(id))
    }
  }
  return result
}

/**
 * format of erc1155 = 0xabc...abc-id
 * @param address
 */
export const isErc1155Address = (address: string) => {
  return /^0x[0-9,a-f,A-Z]{40}-[0-9]{1,}$/g.test(address)
}

export const getNormalAddress = (addresses: string[]) => {
  return addresses.filter((adr: string) => /^0x[0-9,a-f,A-Z]{40}$/g.test(adr))
}

export const formatFloat = (number: number | string, decimal = 4) => {
  number = number.toLocaleString('fullwide', {useGrouping: false})
  const arr = number.split('.')
  if (arr.length > 1) {
    arr[1] = arr[1].slice(0, decimal)
  }
  return arr.join('.')
}

export const formatPercent = (floatNumber: any, decimal: number = 2) => {
  floatNumber = floatNumber.toLocaleString('fullwide', {useGrouping: false})
  return formatFloat(weiToNumber(numberToWei(floatNumber), 16), decimal)
}

export const mul = (a: any, b: any, useFullwide = true) => {
  if (useFullwide) {
    a = a.toLocaleString('fullwide', {useGrouping: false})
    b = b.toLocaleString('fullwide', {useGrouping: false})
  }
  const result = weiToNumber(
    BigNumber.from(numberToWei(a)).mul(numberToWei(b)),
    36,
  )
  const arr = result.split('.')
  arr[1] = arr[1]?.slice(0, 18)
  return arr[1] ? arr.join('.') : arr.join('')
}

export const sub = (a: any, b: any) => {
  a = a.toLocaleString('fullwide', {useGrouping: false})
  b = b.toLocaleString('fullwide', {useGrouping: false})
  return weiToNumber(BigNumber.from(numberToWei(a)).sub(numberToWei(b)))
}

export const div = (a: any, b: any) => {
  if (b.toLocaleString('fullwide', {useGrouping: false}) == '0') {
    return weiToNumber(BigNumber.from(numberToWei((Number(a) / Number(b)).toLocaleString('fullwide', {useGrouping: false}))))
  }
  a = a.toLocaleString('fullwide', {useGrouping: false})
  b = b.toLocaleString('fullwide', {useGrouping: false})
  return weiToNumber(BigNumber.from(numberToWei(a, 36)).div(numberToWei(b)))
}

export const max = (a: any, b: any) => bn(numberToWei(a)).gt(numberToWei(b)) ? a : b

export const add = (a: any, b: any) => {
  a = a.toLocaleString('fullwide', {useGrouping: false})
  b = b.toLocaleString('fullwide', {useGrouping: false})
  return weiToNumber(BigNumber.from(numberToWei(a)).add(numberToWei(b)))
}

export const detectDecimalFromPrice = (price: number | string) => {
  if (Number(price || 0) === 0 || Number(price || 0) >= 1) {
    return 4
  } else {
    price = price.toLocaleString('fullwide', {useGrouping: false})
    const rate = !bn(numberToWei(price)).isZero()
      ? weiToNumber(
        BigNumber.from(numberToWei(1, 36)).div(numberToWei(price)).toString(),
      )
      : '0'
    return rate.split('.')[0].length + 3
  }
}

export const packId = (kind: string, address: string) => {
  const k = bn(kind)
  return k.shl(160).add(address)
}

export const parseUq128x128 = (value: BigNumber, unit = 1000) => {
  return value.mul(unit).shr(112).toNumber() / unit
}

export const parseSqrtSpotPrice = (
  value: BigNumber,
  token0: TokenType,
  token1: TokenType,
  quoteTokenIndex: number,
) => {
  let price = weiToNumber(
    value.mul(value).mul(numberToWei(1, token0?.decimal)).shr(256),
    token1?.decimal,
  )
  if (quoteTokenIndex === 0) {
    price = weiToNumber(bn(numberToWei(1, 36)).div(bn(numberToWei(price))))
  }
  return formatFloat(price, 18)
}

export const parseSqrtX96 = (
  price: BigNumber,
  baseToken: TokenType,
  quoteToken: TokenType,
) => {
  return weiToNumber(
    price
      .mul(price)
      .mul(numberToWei(1, baseToken.decimal + 18))
      .shr(192),
    quoteToken.decimal + 18,
  )
}

const isObject = (item: any) => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

export const mergeDeep = (target: any, ...sources: any): any => {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, {[key]: {}})
        mergeDeep(target[key], source[key])
      } else {
        Object.assign(target, {[key]: source[key]})
      }
    }
  }

  return mergeDeep(target, ...sources)
}

export const getTopics = (): { [key: string]: string[] } => {
  const eventInterface = new ethers.utils.Interface(EventsAbi)
  const events = eventInterface.events
  const topics: { [key: string]: string[] } = {}
  for (const i in events) {
    if (topics[events[i].name]) {
      topics[events[i].name].push(ethers.utils.id(i))
    } else {
      topics[events[i].name] = [ethers.utils.id(i)]
    }
  }
  return topics
}

export function toDailyRate(HALF_LIFE: number, precision = 4) {
  if (HALF_LIFE == 0) {
    return 0
  }
  const rate = 1 - 2 ** (-SECONDS_PER_DAY / HALF_LIFE)
  return Math.round(rate * 10 ** precision) / 10 ** precision
}
