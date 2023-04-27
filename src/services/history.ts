// @ts-nocheck
import {BigNumber, ethers} from "ethers";
import {bn} from "../utils/helper";
import _ from "lodash";
import {PowerState} from 'powerLib/dist/powerLib'
import {LogType, StatesType} from "../types";
import {CurrentPool} from "./currentPool";
import {EventDataAbis, NATIVE_ADDRESS, POOL_IDS} from "../utils/constant";

type ConfigType = {
  account?: string
  CURRENT_POOL: CurrentPool
}

export class History {
  account?: string
  CURRENT_POOL: CurrentPool

  constructor(configs: ConfigType) {
    this.account = configs.account
    this.CURRENT_POOL = configs.CURRENT_POOL
  }

  formatSwapHistory({
                      logs,
                    }: {
    logs: LogType[],
  }) {
    try {
      if (!logs || logs.length === 0) {
        return []
      }

      const swapLogs = logs.map((log) => {
        const formatedData = {
          sideIn: log.args.sideIn?.hex ? bn(log.args.sideIn.hex): bn(log.args.sideIn),
          sideOut: log.args.sideOut?.hex ? bn(log.args.sideOut.hex): bn(log.args.sideOut),
          amountIn: log.args.amountIn?.hex ? bn(log.args.amountIn.hex): bn(log.args.amountIn),
          amountOut: log.args.amountOut?.hex ? bn(log.args.amountOut.hex): bn(log.args.amountOut),
          payer: log.args.payer,
          recipient: log.args.recipient
        }

        const poolIn = log.topics[2].slice(0, 42)
        const poolOut = log.topics[3].slice(0, 42)

        const tokenIn = formatedData.sideIn.eq(POOL_IDS.native)
          ? NATIVE_ADDRESS
          : poolIn + '-' + formatedData.sideIn.toString()

        const tokenOut = formatedData.sideOut.eq(POOL_IDS.native)
          ? NATIVE_ADDRESS
          : poolIn + '-' + formatedData.sideOut.toString()

        return {
          transactionHash: log.transactionHash,
          timeStamp: log.timeStamp,
          poolIn,
          poolOut,
          tokenIn,
          tokenOut,
          ...formatedData
        }
      })

      //@ts-ignore
      return swapLogs.sort((a, b) => (b.blockNumber - a.blockNumber))
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
