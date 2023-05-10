import { BigNumber, ethers, FixedNumber } from 'ethers'
import { MINI_SECOND_PER_DAY, POOL_IDS } from '../utils/constant'
import { CONFIGS } from '../utils/configs'
import EventsAbi from '../abi/Events.json'
import {
  bn,
  div,
  formatPercent,
  numberToWei,
  sub,
  weiToNumber,
} from '../utils/helper'
import { TokenType } from '../types'
import historyProvider from '../historyProvider'
import PoolAbi from '../abi/Pool.json'
import { UniV2Pair } from './uniV2Pair'
import { FixedPoint, floatToFixed128 } from '../utils/number'

const SYNC_EVENT_TOPIC =
  '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'

type ConfigType = {
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  UNIV2PAIR: UniV2Pair
}

const POOL_ID = {
  R: 0x00,
  A: 0x10,
  B: 0x20,
  C: 0x30,
}

const unit = 100000

export class Simulate {
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  UNIV2PAIR: UniV2Pair
  pool: any

  constructor(configs: ConfigType) {
    this.chainId = configs.chainId
    this.scanApi = configs.scanApi
    this.provider = configs.provider
    this.providerToGetLog = configs.providerToGetLog
    this.UNIV2PAIR = configs.UNIV2PAIR

    this.pool = {
      mark: bn('7788445287819172527008699396495269118'),
      k: 2,
      states: {
        twap: bn('6788445287819172527008699396495269118'),
        spot: bn('6788445287819172527008699396495269118'),
        R: bn(numberToWei(10)),
        a: bn(numberToWei(1)),
        b: bn(numberToWei(1)),
        sA: bn(numberToWei(10)),
        sB: bn(numberToWei(10)),
        sC: bn(numberToWei(10)),
      },
    }
  }

  getAmountOut(sideIn: number, amountIn: BigNumber, sideOut: number) {
    const { twap, spot } = this.pool.states

    const exactInWithTwap = this.exactIn(twap, sideIn, amountIn, sideOut)
    const exactInWithSpot = this.exactIn(spot, sideIn, amountIn, sideOut)

    return exactInWithTwap.lt(exactInWithSpot)
      ? exactInWithTwap
      : exactInWithSpot
  }

  exactIn(
    price: BigNumber,
    sideIn: number,
    amountIn: BigNumber,
    sideOut: number,
  ) {
    const { R, a, b, sA, sB, sC } = this.pool.states
    // calculate reserve after swap (unit = base token (WETH))
    let R1 = this.pool.states.R.add(amountIn)
    if (sideIn === POOL_ID.R) {
      R1 = this.pool.states.R.add(amountIn)
    }
    if (sideIn === POOL_ID.A) {
      R1 = this.pool.states.R.add(
        this.getReserveIn({ amountIn, rV: a, sV: sA }),
      )
    }
    if (sideIn === POOL_ID.B) {
      R1 = this.pool.states.R.add(
        this.getReserveIn({ amountIn, rV: b, sV: sB }),
      )
    }
    if (sideIn === POOL_ID.C) {
      R1 = this.pool.states.R.add(
        this.getReserveIn({ amountIn, rV: R.sub(a).sub(b), sV: sC }),
      )
    }

    // ==================
    let amountOut = bn(0)
    if (sideOut === POOL_ID.R) {
      amountOut = R1.sub(R)
    }
    if (sideOut === POOL_ID.A) {
      amountOut = this.dsv({ price, R1, rV: a, sV: sA })
    }
    if (sideOut === POOL_ID.B) {
      amountOut = this.dsv({ price, R1, rV: b, sV: sB })
    }
    if (sideOut === POOL_ID.C) {
      amountOut = this.dsv({ price, R1, rV: R.sub(b).sub(a), sV: sC })
    }
    return amountOut
  }

  getReserveIn({
    amountIn,
    rV,
    sV,
  }: {
    amountIn: BigNumber
    rV: BigNumber
    sV: BigNumber
  }) {
    // dsV = amountIn, rIn = drV = dsV * rV / sV
    return amountIn.mul(rV).sub(sV)
  }

  dsv({
    price,
    R1,
    rV,
    sV,
  }: {
    price: BigNumber
    R1: BigNumber
    rV: BigNumber
    sV: BigNumber
  }) {
    const { mark, k } = this.pool

    const xk = mark.pow(k).mul(unit).div(price.pow(k)).toNumber() / unit
    const rV1 = this._r(floatToFixed128(xk), rV, R1)
    const drV = rV1.sub(rV)
    return drV.mul(sV).sub(rV)
  }

  _r(xk: BigNumber, v: BigNumber, R: BigNumber): BigNumber {
    let r = v.mul(xk).div(FixedPoint.Q128)
    if (r.lt(R.div(2))) {
      const denominator = v.mul(xk.div(4)).div(FixedPoint.Q128)
      const minuend = R.mul(R).div(denominator)
      r = R.sub(minuend)
    }
    return r
  }

  evaluate(sideIn: number, amount: BigNumber) {
    return this.getAmountOut(sideIn, amount, POOL_ID.R)
  }
}
