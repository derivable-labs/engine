import {ethers}              from "ethers";
import {UniV2Pair}                                   from "./uniV2Pair";
import {PoolErc1155StepType, StepType, SwapStepType} from "../types";
import {bn}                                          from "../utils/helper";
import {POOL_IDS}            from "../utils/constant";

type ConfigType = {
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  signer?: ethers.providers.JsonRpcSigner
  UNIV2PAIR: UniV2Pair
}

export class Swap {
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  signer?: ethers.providers.JsonRpcSigner
  UNIV2PAIR: UniV2Pair

  constructor(configs: ConfigType) {
    this.chainId = configs.chainId
    this.scanApi = configs.scanApi
    this.provider = configs.provider
    this.signer = configs.signer
  }

  getDeleverageStep(states: any): PoolErc1155StepType {
    const { priceScaleLong, twapBase } = states
    const [ amountIn, amountOutMin ] = twapBase.lt(priceScaleLong) ?
      [ twapBase, priceScaleLong ] : [ priceScaleLong, twapBase ]
    return {
      idIn: bn(POOL_IDS.cp),
      idOut: bn(POOL_IDS.cp),
      amountIn: amountIn.div(2),
      amountOutMin: amountOutMin.mul(2),
    }
  }
  //
  // async calculateAmountOuts (steps: StepType[], isDeleverage: boolean = false) {
  //   if (!this.signer) return [[bn(0)], bn(0)]
  //   const { stepsToSwap, value } = convertStepForPoolErc1155(formatSwapSteps(steps))
  //   if (isDeleverage) {
  //     stepsToSwap.unshift(this.getDeleverageStep())
  //   }
  //
  //   const res = await callStaticMultiSwap({
  //     steps: stepsToSwap,
  //     gasLimit,
  //     value
  //   })
  //
  //   const result = []
  //   for (const i in steps) {
  //     result.push({ ...steps[i], amountOut: res[0][i] })
  //   }
  //   return [result, bn(gasLimit).sub(res.gasLeft)]
  // }
  //
  // formatSwapSteps(steps: StepType[]): SwapStepType[] {
  //   const stepsToSwap = []
  //   for (const i in steps) {
  //     const step = steps[i]
  //     const tokenIn = getTokenByPower(step.tokenIn) || step.tokenIn
  //     const tokenOut = getTokenByPower(step.tokenOut) || step.tokenOut
  //     if (step.amountIn.isZero() || !tokenIn || !tokenOut) {
  //       continue
  //     }
  //     stepsToSwap.push({
  //       tokenIn,
  //       tokenOut,
  //       amountIn: step.amountIn,
  //       amountOutMin: 0
  //     })
  //   }
  //   return stepsToSwap
  // }
}
