import {Engine} from "../src/engine";
import {ethers, Wallet} from "ethers";
import {bn, numberToWei, weiToNumber} from "../src/utils/helper";
import {POOL_IDS} from "../src/utils/constant";

const PRIVATE_KEY = '28d1bfbbafe9d1d4f5a11c3c16ab6bf9084de48d99fbac4058bdfa3c80b2908c'

const testLocal = async () => {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const walletPrivateKey = new Wallet(PRIVATE_KEY)
  const wallet = walletPrivateKey.connect(provider)

  const engine = new Engine({
    chainId: 31337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545/',
    account: '0x704cF59B16Fd50Efd575342B46Ce9C5e07076A4a',
    provider,
    providerToGetLog: new ethers.providers.JsonRpcProvider('http://localhost:8545/'),
    //@ts-ignore
    signer: wallet
  })
  await engine.RESOURCE.fetchResourceData('0x704cF59B16Fd50Efd575342B46Ce9C5e07076A4a')

  const currentPool = Object.values(engine.RESOURCE.pools)[0]
  engine.setCurrentPool({
    ...currentPool,
    logic: currentPool.logic,
    cTokenPrice: currentPool.cTokenPrice
  })

  const steps = [
    {
      "tokenIn": "C",
      "tokenOut": currentPool.poolAddress + "-1",
      "amountIn": bn(numberToWei(1))
    },
    // {
    //   "tokenIn": "C",
    //   "tokenOut": currentPool.poolAddress + "-" + 1,
    //   "amountIn": bn(numberToWei(1))
    // }
  ]

  await engine.SWAP.updateLeverageAndSize(steps)

}

testLocal()
