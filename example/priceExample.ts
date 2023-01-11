import {getPairInfo, getPairsInfo} from "../src/uniV2Pair";

const test = async () => {
  const pairInfo = await getPairInfo({
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
    pairAddress: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16'
  })

  const pairsInfo = await getPairsInfo({
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
    pairAddresses: ['0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16', '0x7EFaEf62fDdCCa950418312c6C91Aef321375A00']
  })
  console.log({
    pairInfo,
    pairsInfo
  })
}

test()
