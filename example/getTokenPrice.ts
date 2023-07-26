import {Engine} from '../src/engine'
import {ethers} from 'ethers'
import {getTestConfigs} from './shared/testConfigs'
import {bn, numberToWei, parseSqrtX96, weiToNumber} from '../src/utils/helper'

const test = async () => {
  const configs = getTestConfigs(42161)
  const engine = new Engine(configs.account, configs, 42161)

  // const pairInfo = await engine.UNIV2PAIR.getPairInfo({
  //   pairAddress: '0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB',
  // })

  const changedIn24h = await engine.PRICE.get24hChange({
    baseToken: {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      decimal: 18,
      name: '',
      symbol: '',
    },
    quoteToken: {
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      decimal: 6,
      name: '',
      symbol: '',
    },
    cToken: '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443',
    currentPrice: '1900',
    chainId: '42161'
  })

  const res = await engine.PRICE.getTokenPrices([
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  ])

  const priceFloat = parseSqrtX96(
    res['0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'],
    //@ts-ignore
    {decimal: 18},
    //@ts-ignore
    {decimal: 6},
  )
  console.log(priceFloat)
}

test()
