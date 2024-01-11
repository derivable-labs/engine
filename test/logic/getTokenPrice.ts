import { Engine } from '../../src/engine'
import { TestConfiguration } from '../shared/configurations/configurations'

const conf = new TestConfiguration()

export const getTokenPrice = async (
  chainId: number,
  poolAddresses: Array<string>,
  baseTokenAddress: string,
  quoteTokenAddress: string,
  cTokenAddress: string,
): Promise<any | undefined> => {
  try {
    const configs = conf.get(chainId)
    const engine = new Engine(configs)
    await engine.initServices()
    await engine.RESOURCE.fetchResourceData(poolAddresses, configs.account)

    const changedIn24h = await engine.PRICE.get24hChange({
      baseToken: {
        address: baseTokenAddress,
        decimals: 18,
        name: '',
        symbol: '',
      },
      quoteToken: {
        address: quoteTokenAddress,
        decimals: 6,
        name: '',
        symbol: '',
      },
      cToken: cTokenAddress,
      currentPrice: '1900',
      chainId: '42161',
      toTimeMs: 1800000000000,
    })

    const prices = await engine.PRICE.getTokenPriceByRoutes()

    const res = await engine.PRICE.getTokenPrices(['0x4200000000000000000000000000000000000006'])

    return {
      changedIn24h,
      prices,
      tokenPrice: res,
    }
  } catch (error) {
    return undefined
  }
}
