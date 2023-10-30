import {BigNumber, ethers} from 'ethers'
import {TokenType} from '../types'
import EventsAbi from '../abi/Events.json'
import {SECONDS_PER_DAY} from './constant'

const mdp = require('move-decimal-point')

export const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/')

export const bn = BigNumber.from

export const weiToNumber = (wei: any, decimal: number = 18, decimalToDisplay?: number) => {
  if (!wei || !Number(wei)) return '0'
  wei = wei.toString()
  const num = mdp(wei, -decimal)
  if (decimalToDisplay != null) {
    if (decimalToDisplay > 0) {
      return num.slice(0, num.indexOf('.') + decimalToDisplay + 1)
    }
    return num.slice(0, num.indexOf('.'))
  }
  return num
}

export const numberToWei = (number: any, decimal: number = 18) => {
  if (!number) return '0'
  number = number.toString()
  if (Number.isFinite(number)) {
    number = number.toLocaleString('en-US', {useGrouping: false})
  }
  return mdp(number, decimal).split(number.indexOf('.') === -1 ? ',' : '.')[0]
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
  number = number.toLocaleString(['en-US', 'fullwide'], {useGrouping: false})
  const arr = number.split('.')
  if (arr.length > 1) {
    arr[1] = arr[1].slice(0, decimal)
  }
  return arr.join('.')
}

export const formatPercent = (floatNumber: any, decimal: number = 2) => {
  floatNumber = floatNumber.toLocaleString(['en-US', 'fullwide'], {useGrouping: false})
  return formatFloat(weiToNumber(numberToWei(floatNumber), 16), decimal)
}

export const mul = (a: any, b: any, useFullwide = true) => {
  if (useFullwide) {
    a = a.toLocaleString(['en-US', 'fullwide'], {useGrouping: false})
    b = b.toLocaleString(['en-US', 'fullwide'], {useGrouping: false})
  }
  const result = weiToNumber(BigNumber.from(numberToWei(a)).mul(numberToWei(b)), 36)
  const arr = result.split('.')
  arr[1] = arr[1]?.slice(0, 18)
  return arr[1] ? arr.join('.') : arr.join('')
}

export const sub = (a: any, b: any) => {
  a = a.toLocaleString(['en-US', 'fullwide'], {useGrouping: false})
  b = b.toLocaleString(['en-US', 'fullwide'], {useGrouping: false})
  return weiToNumber(BigNumber.from(numberToWei(a)).sub(numberToWei(b)))
}

export const div = (a: any, b: any) => {
  if (b.toLocaleString(['en-US', 'fullwide'], {useGrouping: false}) == '0') {
    return weiToNumber(BigNumber.from(numberToWei((Number(a) / Number(b)).toLocaleString(['en-US', 'fullwide'], {useGrouping: false}))))
  }
  a = a.toLocaleString(['en-US', 'fullwide'], {useGrouping: false})
  b = b.toLocaleString(['en-US', 'fullwide'], {useGrouping: false})
  return weiToNumber(BigNumber.from(numberToWei(a, 36)).div(numberToWei(b)))
}

export const max = (a: any, b: any) => (bn(numberToWei(a)).gt(numberToWei(b)) ? a : b)

export const add = (a: any, b: any) => {
  a = a.toLocaleString(['en-US', 'fullwide'], {useGrouping: false})
  b = b.toLocaleString(['en-US', 'fullwide'], {useGrouping: false})
  return weiToNumber(BigNumber.from(numberToWei(a)).add(numberToWei(b)))
}

export const detectDecimalFromPrice = (price: number | string) => {
  if (Number(price || 0) === 0 || Number(price || 0) >= 1) {
    return 4
  } else {
    price = price.toLocaleString(['en-US', 'fullwide'], {useGrouping: false})
    const rate = !bn(numberToWei(price)).isZero() ? weiToNumber(BigNumber.from(numberToWei(1, 36)).div(numberToWei(price)).toString()) : '0'
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

export const parseSqrtSpotPrice = (value: BigNumber, baseToken: TokenType, quoteToken: TokenType) => {
  const quoteTokenIndex =
    baseToken.address.localeCompare(quoteToken.address, undefined, {sensitivity: 'base'}) < 0 ?
    1 : 0
  const [token0, token1] = quoteTokenIndex == 1 ?
    [baseToken, quoteToken] : [quoteToken, baseToken]
  let price = weiToNumber(value.mul(value).mul(numberToWei(1, token0?.decimal)).shr(256), token1?.decimal)
  console.log(value.toString(), value.mul(value).mul(numberToWei(1, token0?.decimal)).shr(256).toString(), price)
  if (quoteTokenIndex === 0) {
    price = weiToNumber(bn(numberToWei(1, 36)).div(bn(numberToWei(price))))
  }
  return formatFloat(price, 18)
}

export const parseSpotPrice = (value: BigNumber, baseToken: TokenType, quoteToken: TokenType) => {
  const quoteTokenIndex =
    baseToken.address.localeCompare(quoteToken.address, undefined, {sensitivity: 'base'}) < 0 ?
    1 : 0
  const [token0, token1] = quoteTokenIndex == 1 ?
    [baseToken, quoteToken] : [quoteToken, baseToken]
  let price = weiToNumber(value.mul(numberToWei(1, token0?.decimal)).shr(128), token1?.decimal)
  if (quoteTokenIndex === 0) {
    price = weiToNumber(bn(numberToWei(1, 36)).div(bn(numberToWei(price))))
  }
  return formatFloat(price, 18)
}

export const parseSqrtX96 = (price: BigNumber, baseToken: TokenType, quoteToken: TokenType) => {
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

export function rateToHL(r: number, k: number, DURATION = SECONDS_PER_DAY) {
  return Math.ceil((DURATION * Math.LN2) / r / k / k)
}

export function rateFromHL(HL: number, k: number, DURATION = SECONDS_PER_DAY) {
  return (DURATION * Math.LN2) / HL / k / k
}

export const kx = (k: number, R: BigNumber, v: BigNumber, spot: BigNumber, MARK: BigNumber, PRECISION: number = 1000000): number => {
  try {
    const xk = Math.pow(spot.mul(PRECISION).div(MARK).toNumber() / PRECISION, k)
    const vxk4 = v
      .mul(Math.round(xk * PRECISION))
      .shl(2)
      .div(PRECISION)
    const denom = vxk4.gt(R) ? vxk4.sub(R) : R.sub(vxk4)
    const num = R.mul(k)
    return num.mul(PRECISION).div(denom).toNumber() / PRECISION
  } catch (err) {
    console.warn(err)
    return 0
  }
}


export interface Proof {
  readonly block: Uint8Array
  readonly accountProofNodesRlp: Uint8Array
  readonly reserveAndTimestampProofNodesRlp: Uint8Array
  readonly priceAccumulatorProofNodesRlp: Uint8Array
}

export type ProofResult = {
  readonly accountProof: readonly Uint8Array[]
  readonly storageProof: readonly {
    readonly key: bigint
    readonly value: bigint
    readonly proof: readonly Uint8Array[]
  }[]
}

export type Block = {
  readonly parentHash: bigint
  readonly sha3Uncles: bigint
  readonly miner: bigint
  readonly stateRoot: bigint
  readonly transactionsRoot: bigint
  readonly receiptsRoot: bigint
  readonly logsBloom: bigint
  readonly difficulty: bigint
  readonly number: bigint
  readonly gasLimit: bigint
  readonly gasUsed: bigint
  readonly timestamp: bigint
  readonly extraData: Uint8Array
  readonly mixHash: bigint | undefined
  readonly nonce: bigint | null
  readonly baseFeePerGas: bigint | null
}


export type EthGetStorageAt = (address: bigint, position: bigint, block: bigint | 'latest') => Promise<bigint>
export type EthGetProof = (address: bigint, positions: readonly bigint[], block: bigint) => Promise<ProofResult>
export type EthGetBlockByNumber = (blockNumber: bigint | 'latest') => Promise<Block | null>

export function addressToString(value: bigint) {
  return `0x${value.toString(16).padStart(40, '0')}`
}
