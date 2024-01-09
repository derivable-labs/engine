import { Engine } from '../../src/engine'
import { weiToNumber } from '../../src/utils/helper'
import { TestConfiguration } from '../shared/configurations/configurations'

const conf = new TestConfiguration()

export const getBalanceAndAllowance = async (chainId: number, poolAddresses: Array<string>, wallet: string) => {
  const configs = conf.get(chainId)
  const engine = new Engine(configs)
  await engine.initServices()
  await engine.RESOURCE.fetchResourceData(poolAddresses, configs.account)
  const tokens = engine.RESOURCE.tokens
  const tokenArr = tokens.map((t) => t.address)

  const res = await engine.BNA.getBalanceAndAllowance({
    tokens: tokenArr,
  })

  console.log(weiToNumber(res.balances[wallet]))

  console.log(res)
}
