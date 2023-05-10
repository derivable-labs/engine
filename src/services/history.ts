import { ethers } from 'ethers'
import { PowerState } from 'powerLib/dist/powerLib'
import { LogType } from '../types'
import { CurrentPool } from './currentPool'
import { EventDataAbis, NATIVE_ADDRESS, POOL_IDS } from '../utils/constant'
import { ConfigType } from './setConfig'

export class History {
  account?: string
  CURRENT_POOL: CurrentPool

  constructor(config: ConfigType) {
    this.account = config.account
    this.CURRENT_POOL = new CurrentPool(config)
  }

  formatSwapHistory({ logs }: { logs: LogType[] }) {
    try {
      if (!logs || logs.length === 0) {
        return []
      }

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

        const tokenIn = formatedData.sideIn.eq(POOL_IDS.native)
          ? NATIVE_ADDRESS
          : poolIn + '-' + formatedData.sideIn.toString()

        const tokenOut = formatedData.sideOut.eq(POOL_IDS.native)
          ? NATIVE_ADDRESS
          : poolIn + '-' + formatedData.sideOut.toString()

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
      return swapLogs.sort((a, b) => b.blockNumber - a.blockNumber)
    } catch (e) {
      throw e
    }
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
