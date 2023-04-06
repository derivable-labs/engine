import {BigNumber, ethers, utils} from "ethers";
import LogicAbi56                 from '../abi/56/Logic.json'
import LogicAbi97                 from '../abi/97/Logic.json'
import LogicAbi31337              from '../abi/31337/Logic.json'
import LogicAbi42161              from '../abi/31337/Logic.json'

const LogicAbi = {
  56: LogicAbi56,
  97: LogicAbi97,
  31337: LogicAbi31337,
  42161: LogicAbi42161
}
export const provider = new ethers.providers.JsonRpcProvider(
  "https://bsc-dataseed.binance.org/"
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
    if(power !== 0) {
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

export const getLogicAbi = (chainId: number) => {
  return LogicAbi[chainId]
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

export const formatFloat = (number: number | string, decimal?: number) => {
  if (!decimal) {
    decimal = detectDecimalFromPrice(number)
  }

  number = number.toString()
  const arr = number.split('.')
  if (arr.length > 1) {
    arr[1] = arr[1].slice(0, decimal)
  }
  return Number(arr.join('.'))
}

export const formatPercent = (floatNumber: any, decimal: number = 2) => {
  floatNumber = floatNumber.toString()
  return formatFloat(weiToNumber(numberToWei(floatNumber), 16), decimal)
}

export const mul = (a: any, b: any) => {
  const result = weiToNumber(
    BigNumber.from(numberToWei(a)).mul(numberToWei(b)),
    36
  )
  const arr = result.split('.')
  arr[1] = arr[1]?.slice(0, 18)
  return arr[1] ? arr.join('.') : arr.join('')
}

export const sub = (a: any, b: any) => {
  return weiToNumber(BigNumber.from(numberToWei(a)).sub(numberToWei(b)))
}

export const div = (a: any, b: any) => {
  if (!b || b.toString() === '0') {
    return '0'
  }
  return weiToNumber(BigNumber.from(numberToWei(a, 36)).div(numberToWei(b)))
}

export const add = (a: any, b: any) => {
  return weiToNumber(BigNumber.from(numberToWei(a)).add(numberToWei(b)))
}

export const detectDecimalFromPrice = (price: number | string) => {
  if (Number(price || 0) === 0 || Number(price || 0) >= 1) {
    return 4
  } else {
    const rate = !bn(numberToWei(price)).isZero()
      ? weiToNumber(
        BigNumber.from(numberToWei(1, 36)).div(numberToWei(price)).toString()
      )
      : '0'
    return rate.split('.')[0].length + 3
  }
}

export const packId = (kind: string, address: string) => {
  const k = bn(kind)
  return k.shl(160).add(address)
}

export const parseUq112x112 = (value: BigNumber, unit = 1000) => {
  return value.mul(unit).shr(112).toNumber() / unit
}
