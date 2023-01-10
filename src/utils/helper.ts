import {BigNumber, ethers, utils} from "ethers";
import LogicAbi56 from '../abi/56/Logic.json'
import LogicAbi97 from '../abi/97/Logic.json'
import LogicAbi31337 from '../abi/31337/Logic.json'
const LogicAbi = {
  56: LogicAbi56,
  97: LogicAbi97,
  31337: LogicAbi31337
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
  powersBytes = ethers.utils.hexStripZeros(powersBytes).slice(2)
  const raws: any = powersBytes.match(/.{1,4}/g)
  const powers = []
  for (let i = raws.length - 1; i >= 0; --i) {
    let power = Number('0x' + raws[i])
    if (power > 0x8000) {
      power = 0x8000 - power
    }
    powers.push(power)
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
