import { Engine } from '../src/engine'
import { ethers } from 'ethers'
import { getTestConfigs } from './shared/testConfigs'
import {bn, numberToWei, parseSqrtX96, weiToNumber} from "../src/utils/helper";

const test = async () => {
  const configs = getTestConfigs(42161)
  const engine = new Engine(configs.account, configs, 42161)

  // const pairInfo = await engine.UNIV2PAIR.getPairInfo({
  //   pairAddress: '0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB',
  // })

  const res = await engine.PRICE.getTokenPrices([
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
  ])

  const priceFloat = parseSqrtX96(
    res['0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'],
    //@ts-ignore
     {decimal: 18},
    //@ts-ignore
    {decimal: 6}
  )
  console.log(priceFloat)

}

test()
