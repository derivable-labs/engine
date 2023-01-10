import {DdlResource} from "../src/pools";
import {getBalanceAndAllowance} from "../src/balanceAndAllowance";

const test = async () => {
  const res = await getBalanceAndAllowance({
    account: '0xC06F7cF8C9e8a8D39b0dF5A105d66127912Bc980',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
    tokens: [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16",
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      "0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-0",
      "0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-1",
      "0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-2",
      "0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-3",
      "0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-4",
      "0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-5",
      "0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-6",
      "0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-7",
      "0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42-65536",
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
    ]
  })
  console.log(res)
}

test()
