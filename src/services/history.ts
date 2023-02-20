// @ts-nocheck
import {BigNumber, ethers} from "ethers";
import {bn} from "../utils/helper";
import _ from "lodash";
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
      const orders = logGrouped.slice().sort((a: { blockNumber: number; }[], b: { blockNumber: number; }[]) => a[0].blockNumber - b[0].blockNumber)
      // const swapLogs = logs.slice().sort((a: { timeStamp: number; }, b: { timeStamp: number; }) => a.timeStamp - b.timeStamp)

      const p = new PowerState({ powers: [...powers] })
      p.loadStates(states)

      //@ts-ignore
      const result = []
      const balances: { [key: number]: BigNumber } = {}

      orders.forEach((txs: LogType[]) => {
        const cAmount = bn(0)
        const cp = bn(0)
        const oldBalances = _.cloneDeep(balances)
        const oldLeverage = this.calculateLeverage(p, oldBalances, powers)
        //
        for (const tx of txs) {
          if (tx.args.name === 'Transfer') {
            const encodeData = ethers.utils.defaultAbiCoder.encode(
              ["address", "address", "uint256"], tx.args.args
            )
            const formatedData = ethers.utils.defaultAbiCoder.decode(
              ["address from", "address to", "uint256 value"],
              encodeData
            )
            const id = this.CURRENT_POOL.getIdByAddress(tx.address)?.toNumber()
            if (!id) continue
            if (formatedData.from === this.account) {
              balances[id] = balances[id] ? balances[id].sub(formatedData.value) : bn(0).sub(formatedData.value)
            } else if (formatedData.to === this.account) {
              balances[id] = balances[id] ? balances[id].add(formatedData.value) : bn(0).add(formatedData.value)
            }
            continue
          }

          if (tx.args.name === 'TransferSingle') {
            const encodeData = ethers.utils.defaultAbiCoder.encode(
              ["address", "address", "address", "uint256", "uint256"], tx.args.args
            )
            const formatedData = ethers.utils.defaultAbiCoder.decode(
              ["address operator", "address from", "address to", "uint256 id", "uint256 value"],
              encodeData
            )

            const id = formatedData.id.toNumber()

            if (formatedData.from === this.account) {
              balances[id] = balances[id] ? balances[id].sub(formatedData.value) : bn(0).sub(formatedData.value)
            }
            if (formatedData.to === this.account) {
              balances[id] = balances[id] ? balances[id].add(formatedData.value) : bn(0).add(formatedData.value)
            }
          }
        }

        const newLeverage = this.calculateLeverage(p, balances, powers)

        result.push({
          transactionHash: txs[0].transactionHash,
          timeStamp: txs[0].timeStamp,
          blockNumber: txs[0].blockNumber,
          cp,
          oldBalances,
          newBalances: _.cloneDeep(balances),
          cAmount,
          newLeverage,
          oldLeverage
        })
      })

      //@ts-ignore
      return result.sort((a, b) => (b.blockNumber - a.blockNumber))
    } catch (e) {
      console.error(e)
      return []
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
