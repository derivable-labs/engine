import {Engine}                    from "../src/engine";
import {getTestConfigs} from "./shared/testConfigs";

const test = async () => {
  const engine = new Engine(getTestConfigs(1337))

  const pairInfo = await engine.UNIV3PAIR.getPairInfo({
    pairAddress: '0x2c8c4D78C6187602dDb8C4b803C3bcFb614ce6d7'
  })

  console.log({
    pairInfo,
  })
}

test()
