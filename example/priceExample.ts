import {LP_PRICE_UNIT, POOL_IDS} from "../src/utils/constant";
import {ethers}                  from "ethers";
import {bn, getLogicAbi}         from "../src/utils/helper";
import {Engine}                  from "../src/engine";

const token0 = {
  address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  decimal: 18,
  name: 'wbnb',
  symbol: 'wbnb',
}

const token1 = {
  address: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
  decimal: 18,
  name: 'BUSD',
  symbol: 'BUSD',
}

const logicAddress = '0xdD4A0c754a802c69f488645faD474081D2f117d7';
const cTokenAddress = '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16';

const test = async () => {
  const engine = new Engine({
    chainId: 56,
    provider: new ethers.providers.JsonRpcProvider('https://bscrpc.com/'),
    providerToGetLog: new ethers.providers.JsonRpcProvider('https://bscrpc.com/'),
    scanApi: 'https://api.bscscan.com/api',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
  })


  const res24hChangeByLog = await engine.PRICE.get24hChangeByLog({
    baseToken: token0,
    quoteToken: token1,
    cToken: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
    currentPrice: '200',
    baseId: POOL_IDS.token0
  })
  console.log('res24hChangeByLog', res24hChangeByLog)

  const res24hChange = await engine.PRICE.get24hChange({
    baseToken: token0,
    quoteToken: token1,
    cToken: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
    currentPrice: '200'
  })
  console.log('res24hChange', res24hChange)

  const nativePrice = await engine.PRICE.getNativePrice()
  console.log('nativePrice', nativePrice)

  const provider = new ethers.providers.JsonRpcProvider('https://bscrpc.com/')
  const logicContract = new ethers.Contract(logicAddress, getLogicAbi(56), provider)
  const states = await logicContract.getStates()
  const cTokenPrice = bn(states.twap.LP._x).mul(LP_PRICE_UNIT).shr(112).toNumber() / LP_PRICE_UNIT
  const cpPrice = await engine.PRICE.fetchCpPrice({
    states,
    cToken: cTokenAddress,
    poolAddress: '0x7Eb8e543A960b4bCA5392a2960E355d2374EDB42',
    cTokenPrice
  })
  console.log('cpPrice', cpPrice)
  }

test()
