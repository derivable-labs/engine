import {BigNumber, ethers} from "ethers";
import {UniV2Pair}         from "./uniV2Pair";
import {bn}                from "../utils/helper";
import _                   from "lodash";
import {PowerState}        from 'powerLib/lib/index'

type ConfigType = {
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  UNIV2PAIR: UniV2Pair
}

export class History {
  formatSwapHistory({
    logs,
    poolAddress,
    states,
    powers
  }: any) {
    try {
      if (!logs || logs.length === 0 || !poolAddress) {
        return []
      }
      const swapLogs = logs.slice().sort((a: { timeStamp: number; }, b: { timeStamp: number; }) => a.timeStamp - b.timeStamp)

      const p = new PowerState({ powers: [...powers] })
      p.loadStates(states)

      const result = []
      const balancesToCalculateLeverage = {}
      const balances: { [key: number]: BigNumber } = {}
      for (const swapLog of swapLogs) {
        if (swapLog.args.pool !== poolAddress) continue

        const steps = swapLog.args.steps
        const cAmount = bn(0)
        const cp = bn(0)
        const oldBalances = _.cloneDeep(balances)
        const oldLeverage = p.calculateCompExposure(balancesToCalculateLeverage)

        for (const step of steps) {
          balances[step.idIn.toString()] = balances[step.idIn.toString()] ? balances[step.idIn.toString()].sub(step.amountIn) : bn(0).sub(step.amountIn)
          balances[step.idOut.toString()] = balances[step.idOut.toString()] ? balances[step.idOut.toString()].add(step.amountOutMin) : bn(0).add(step.amountOutMin)

          if (powers[step.idIn]) {
            balancesToCalculateLeverage[powers[step.idIn]] = balancesToCalculateLeverage[powers[step.idIn]] ? balancesToCalculateLeverage[powers[step.idIn]].sub(step.amountIn) : bn(0).sub(step.amountIn)
          }
          if (powers[step.idOut]) {
            balancesToCalculateLeverage[powers[step.idOut]] = balancesToCalculateLeverage[powers[step.idOut]] ? balancesToCalculateLeverage[powers[step.idOut]].add(step.amountOutMin) : bn(0).add(step.amountOutMin)
          }
        }
        const newLeverage = p.calculateCompExposure(balancesToCalculateLeverage)
        result.push({
          transactionHash: swapLog.transactionHash,
          timeStamp: swapLog.timeStamp,
          cp,
          oldBalances,
          newBalances: _.cloneDeep(balances),
          cAmount,
          newLeverage,
          oldLeverage
        })
      }
      return result.sort((a, b) => (b.timeStamp - a.timeStamp))
    } catch (e) {
      console.error(e)
      return []
    }
  }
}
