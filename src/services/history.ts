import {BigNumber, ethers} from "ethers";
import {UniV2Pair} from "./uniV2Pair";
import {bn} from "../utils/helper";
import _, {transform} from "lodash";
import {PowerState} from 'powerLib/dist/powerLib'
import {LogType, StatesType} from "../types";
import {CurrentPool} from "./currentPool";

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
    poolAddress,
    states,
    powers
  }: {
    logs: LogType[],
    poolAddress: string,
    states: StatesType
    powers: number[]
  }) {
    try {
      if (!logs || logs.length === 0 || !poolAddress) {
        return []
      }

      const logGrouped: any = Object.values(_.groupBy(logs, (log) => log.transactionHash))
                                    .filter((order) => {
                                      return order.find((log) => ['TransferSingle', 'TransferBatch'].includes(log.args.name))
                                    })
      const orders = logGrouped.slice().sort((a: { timeStamp: number; }[], b: { timeStamp: number; }[]) => a[0].timeStamp - b[0].timeStamp)
      // const swapLogs = logs.slice().sort((a: { timeStamp: number; }, b: { timeStamp: number; }) => a.timeStamp - b.timeStamp)

      const p = new PowerState({ powers: [...powers] })
      p.loadStates(states)

      //@ts-ignore
      const result = []
      const balancesToCalculateLeverage = {}
      const balances: { [key: number]: BigNumber } = {}

      orders.forEach((txs: LogType[]) => {
        const cAmount = bn(0)
        const cp = bn(0)
        const oldBalances = _.cloneDeep(balances)
        const oldLeverage = p.calculateCompExposure(balancesToCalculateLeverage)
        //
        for (const tx of txs) {
          if (tx.args.name === 'Transfer') {
            const id = this.CURRENT_POOL.getIdByAddress(tx.address)?.toNumber()
            if (!id) continue
            if (tx.args.args.from === this.account) {
              balances[id] = balances[id] ? balances[id].sub(tx.args.args.value) : bn(0).sub(tx.args.args.value)
            } else if (tx.args.args.to === this.account) {
              balances[id] = balances[id] ? balances[id].add(tx.args.args.value) : bn(0).add(tx.args.args.value)
            }
            continue
          }

          if (tx.args.name === 'TransferSingle') {
            const id = tx.args.args.id.toNumber()

            if (tx.args.args.from === this.account) {
              balances[id] = balances[id] ? balances[id].sub(tx.args.args.value) : bn(0).sub(tx.args.args.value)
            }
            if (tx.args.args.to === this.account) {
              balances[id] = balances[id] ? balances[id].add(tx.args.args.value) : bn(0).add(tx.args.args.value)
            }
          }

          // balances[step.idIn.toString()] = balances[step.idIn.toString()] ? balances[step.idIn.toString()].sub(step.amountIn) : bn(0).sub(step.amountIn)
          // balances[step.idOut.toString()] = balances[step.idOut.toString()] ? balances[step.idOut.toString()].add(step.amountOutMin) : bn(0).add(step.amountOutMin)
          //
          // if (powers[step.idIn]) {
          //   balancesToCalculateLeverage[powers[step.idIn]] = balancesToCalculateLeverage[powers[step.idIn]] ? balancesToCalculateLeverage[powers[step.idIn]].sub(step.amountIn) : bn(0).sub(step.amountIn)
          // }
          // if (powers[step.idOut]) {
          //   balancesToCalculateLeverage[powers[step.idOut]] = balancesToCalculateLeverage[powers[step.idOut]] ? balancesToCalculateLeverage[powers[step.idOut]].add(step.amountOutMin) : bn(0).add(step.amountOutMin)
          // }
        }

        // const newLeverage = p.calculateCompExposure(balancesToCalculateLeverage)
        const newLeverage = this.calculateLeverage(p, balances, powers)

        result.push({
          transactionHash: txs[0].transactionHash,
          timeStamp: txs[0].timeStamp,
          cp,
          oldBalances,
          newBalances: _.cloneDeep(balances),
          cAmount,
          newLeverage,
          oldLeverage
        })
      })

      // for (const swapLog of swapLogs) {
      //   if (swapLog.args.pool !== poolAddress) continue
      //
      //   const steps = swapLog.args.steps
      //   const cAmount = bn(0)
      //   const cp = bn(0)
      //   const oldBalances = _.cloneDeep(balances)
      //   const oldLeverage = p.calculateCompExposure(balancesToCalculateLeverage)
      //
      //   for (const step of steps) {
      //     balances[step.idIn.toString()] = balances[step.idIn.toString()] ? balances[step.idIn.toString()].sub(step.amountIn) : bn(0).sub(step.amountIn)
      //     balances[step.idOut.toString()] = balances[step.idOut.toString()] ? balances[step.idOut.toString()].add(step.amountOutMin) : bn(0).add(step.amountOutMin)
      //
      //     if (powers[step.idIn]) {
      //       balancesToCalculateLeverage[powers[step.idIn]] = balancesToCalculateLeverage[powers[step.idIn]] ? balancesToCalculateLeverage[powers[step.idIn]].sub(step.amountIn) : bn(0).sub(step.amountIn)
      //     }
      //     if (powers[step.idOut]) {
      //       balancesToCalculateLeverage[powers[step.idOut]] = balancesToCalculateLeverage[powers[step.idOut]] ? balancesToCalculateLeverage[powers[step.idOut]].add(step.amountOutMin) : bn(0).add(step.amountOutMin)
      //     }
      //   }
      //   const newLeverage = p.calculateCompExposure(balancesToCalculateLeverage)
      //   result.push({
      //     transactionHash: swapLog.transactionHash,
      //     timeStamp: swapLog.timeStamp,
      //     cp,
      //     oldBalances,
      //     newBalances: _.cloneDeep(balances),
      //     cAmount,
      //     newLeverage,
      //     oldLeverage
      //   })
      // }
      //@ts-ignore
      return result.sort((a, b) => (b.timeStamp - a.timeStamp))
    } catch (e) {
      console.error(e)
      return []
    }
  }

  calculateLeverage(powerState: PowerState, balances: any, powers: number[]) {
    const _balances = {}
    for (let i in balances) {
      if (powers[i]) {
        _balances[i] = balances[i]
      }
    }
    return powerState.calculateCompExposure(_balances)
  }
}
