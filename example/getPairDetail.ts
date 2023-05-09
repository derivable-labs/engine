import { Engine } from '../src/engine'
import { ethers } from 'ethers'
import { DEFAULT_CONFIG } from '../src/utils/configs'

const test = async () => {
  // const engine = new Engine({
  //   chainId: 56,
  //   provider: new ethers.providers.JsonRpcProvider('https://bscrpc.com/'),
  //   providerToGetLog: new ethers.providers.JsonRpcProvider('https://bscrpc.com/'),
  //   scanApi: 'https://api.bscscan.com/api',
  //   rpcUrl: 'https://bsc-dataseed.binance.org/',
  // })
  const engine = new Engine(
    '0xbC52C688c34A480c6785A38715c693Bb22863DE1',
    DEFAULT_CONFIG,
  )

  const pairInfo = await engine.UNIV2PAIR.getPairInfo({
    pairAddress: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
  })

  const pairsInfo = await engine.UNIV2PAIR.getPairsInfo({
    pairAddresses: [
      '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
      '0x7EFaEf62fDdCCa950418312c6C91Aef321375A00',
    ],
  })
  console.log({
    pairInfo,
    pairsInfo,
  })
}

test()
