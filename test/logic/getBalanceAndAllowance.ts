import { Engine } from '../../src/engine'
import { IEngineConfig } from '../../src/utils/configs'

export const getBalanceAndAllowance = async (configs: IEngineConfig, poolAddresses: Array<string>): Promise<any> => {
  const engine = new Engine(configs)
  await engine.initServices()
  await engine.RESOURCE.fetchResourceData(poolAddresses, configs.account!)
  const tokens = engine.RESOURCE.tokens
  const tokenArr = tokens.map((t) => t.address)

  const res = await engine.BNA.getBalanceAndAllowance({
    tokens: tokenArr,
  })

  return res
}
