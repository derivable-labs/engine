import { Engine } from '../src/engine'
import { getTestConfigs } from './shared/testConfigs'
import { BigNumber } from 'ethers'
import { FixedPoint } from '../src/utils/number'
import PowerState from "../src/services/power";
import {bn, numberToWei} from "../src/utils/helper";
import {NATIVE_ADDRESS} from "../src/utils/constant";

const testLocal = async () => {
  const configs = getTestConfigs(1337)
  const engine = new Engine(configs.account, configs, 1337)
  await engine.RESOURCE.fetchResourceData(
    '0xbC52C688c34A480c6785A38715c693Bb22863DE1',
  )

  const currentPool = Object.values(engine.RESOURCE.poolGroups)[0]
  engine.setCurrentPool({
    ...currentPool,
  })

  const tokens = engine.RESOURCE.tokens
  const tokenArr = tokens.map((t) => t.address)

  const res = await engine.BNA.getBalanceAndAllowance({
    tokens: tokenArr,
  })

  const power = new PowerState({k: currentPool.k})
  power.loadPools(currentPool)
  const a = power.getSwapSteps(res.balances, 3, bn(numberToWei(-1)), NATIVE_ADDRESS)
  console.log(a)
}

testLocal()
