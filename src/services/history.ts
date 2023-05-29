import {BigNumber, ethers} from 'ethers'
import {PowerState} from 'powerLib/dist/powerLib'
import {LogType} from '../types'
import {CurrentPool} from './currentPool'
import {EventDataAbis, NATIVE_ADDRESS, POOL_IDS} from '../utils/constant'
import {ConfigType} from './setConfig'
import {Resource} from "./resource";

export class History {
  account?: string
  CURRENT_POOL: CurrentPool

  constructor(config: ConfigType & {CURRENT_POOL: CurrentPool}) {
    this.account = config.account
    this.CURRENT_POOL = config.CURRENT_POOL
  }

  formatSwapHistory({ logs }: { logs: LogType[] }) {
    try {
      if (!logs || logs.length === 0) {
        return []
      }

      const poolAddresses = Object.keys(this.CURRENT_POOL.pools)

      const swapLogs = logs.map((log) => {
        const encodeData = ethers.utils.defaultAbiCoder.encode(
          EventDataAbis.Swap,
          log.args.args,
        )
        const formatedData = ethers.utils.defaultAbiCoder.decode(
          EventDataAbis.Swap,
          encodeData,
        )

        const { poolIn, poolOut } = formatedData

        if(!poolAddresses.includes(poolIn) || !poolAddresses.includes(poolOut)) {
          return null
        }

        const tokenIn = this.getTokenAddressByPoolAndSide(poolIn, formatedData.sideIn)
        const tokenOut = this.getTokenAddressByPoolAndSide(poolOut, formatedData.sideOut)

        return {
          transactionHash: log.transactionHash,
          timeStamp: log.timeStamp,
          blockNumber: log.blockNumber,
          poolIn,
          poolOut,
          tokenIn,
          tokenOut,
          ...formatedData,
        }
      })

      //@ts-ignore
      return swapLogs
        .filter((l) => l !== null)
        //@ts-ignore
        .sort((a, b) => b.blockNumber - a.blockNumber)
    } catch (e) {
      throw e
    }
  }

  getTokenAddressByPoolAndSide(poolAddress: string, side: BigNumber) {
    const pool = this.CURRENT_POOL.pools[poolAddress]
    if(side.eq(POOL_IDS.native)) {
      return NATIVE_ADDRESS
    }
    if(side.eq(POOL_IDS.R)) {
      return pool?.TOKEN_R || NATIVE_ADDRESS
    }
    return poolAddress + '-' + side.toString()
  }

  calculateLeverage(powerState: PowerState, balances: any, powers: number[]) {
    const _balances = {}
    for (let i in balances) {
      if (powers[i]) {
        _balances[powers[i]] = balances[i]
      }
    }
    return powerState.calculateCompExposure(_balances)
  }
}
