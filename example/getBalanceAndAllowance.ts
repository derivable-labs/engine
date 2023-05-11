import { Engine } from '../src/engine'
import { getTestConfigs } from './shared/testConfigs'
import {weiToNumber} from "../src/utils/helper";

const test = async () => {
  const configs = getTestConfigs(1337)
  const engine = new Engine(configs.account, configs, 1337)
  await engine.RESOURCE.fetchResourceData(
    '0xbC52C688c34A480c6785A38715c693Bb22863DE1',
  )
  const tokens = engine.RESOURCE.tokens
  const tokenArr = tokens.map((t) => t.address)

  const res = await engine.BNA.getBalanceAndAllowance({
    tokens: tokenArr,
  })

  console.log(
    weiToNumber(res.balances['0xD9de0da3adE2a8b2FB27C453c065D46aa01574BA']),
  )

  console.log(res)
}

test()
