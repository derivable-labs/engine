import {Engine}                    from "../src/engine";
import {getTestConfigs} from "./shared/testConfigs";
import {bn, numberToWei, weiToNumber} from "../src/utils/helper"

const test = async () => {
  const engine = new Engine(getTestConfigs(1337))

  const pairInfo = await engine.UNIV3PAIR.getPairInfo({
    pairAddress: '0xBf4CC059DfF52AeFe7f12516e4CA4Bc691D97474'
  })

  console.log({
    pairInfo,
  })
  const oracle = bn(1).shl(255).add(bn(300).shl(256 - 64)).add('0xBf4CC059DfF52AeFe7f12516e4CA4Bc691D97474').toHexString()
  console.log(oracle)
}

test()
