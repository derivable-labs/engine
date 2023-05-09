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
  //   account: '0xC06F7cF8C9e8a8D39b0dF5A105d66127912Bc980'
  // })
  const engine = new Engine(
    '0xbC52C688c34A480c6785A38715c693Bb22863DE1',
    DEFAULT_CONFIG,
  )

  const res = await engine.BNA.getBalanceAndAllowance({
    tokens: [
      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
      '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      '0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-0',
      '0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-1',
      '0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-2',
      '0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-3',
      '0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-4',
      '0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-5',
      '0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-6',
      '0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-7',
      '0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-65536',
      '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    ],
  })

  console.log(
    weiToNumber(res.balances['0xD9de0da3adE2a8b2FB27C453c065D46aa01574BA']),
  )

  console.log(res)
}

test()
