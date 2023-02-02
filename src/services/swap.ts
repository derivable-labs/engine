import {BigNumber, ethers} from "ethers";
import {UniV2Pair} from "./uniV2Pair";
import {PoolErc1155StepType, StepType, SwapStepType} from "../types";
import {bn, isErc1155Address, numberToWei} from "../utils/helper";
import {POOL_IDS, ZERO_ADDRESS} from "../utils/constant";
import {CONFIGS} from "../utils/configs";
import {CurrentPool} from "./currentPool";
import RouterAbi from "../abi/router.json";
import UtrAbi from "../abi/UTR.json";
import PoolAbi from "../abi/Pool.json";

type ConfigType = {
  account?: string
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  signer?: ethers.providers.JsonRpcSigner
  UNIV2PAIR: UniV2Pair
  CURRENT_POOL: CurrentPool
}

// TODO: don't hardcode these
const fee10000 = 30

const gasLimit = 30000000
const ACTION_RECORD_CALL_RESULT = 2;
const ACTION_INJECT_CALL_RESULT = 4;
const TRANSFER_FROM_SENDER = 0;


export class Swap {
  account?: string
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  signer?: ethers.providers.JsonRpcSigner
  UNIV2PAIR: UniV2Pair
  CURRENT_POOL: CurrentPool

  constructor(configs: ConfigType) {
    this.account = configs.account
    this.chainId = configs.chainId
    this.scanApi = configs.scanApi
    this.provider = configs.provider
    this.signer = configs.signer
    this.CURRENT_POOL = configs.CURRENT_POOL
  }

  getDeleverageStep(): PoolErc1155StepType {
    const { priceScaleLong, twapBase } = this.CURRENT_POOL.states
    const [amountIn, amountOutMin] = twapBase.lt(priceScaleLong) ?
      [twapBase, priceScaleLong] : [priceScaleLong, twapBase]
    return {
      idIn: bn(POOL_IDS.cp),
      idOut: bn(POOL_IDS.cp),
      amountIn: amountIn.div(2),
      amountOutMin: amountOutMin.mul(2),
    }
  }

  //
  async calculateAmountOuts(steps: StepType[], isDeleverage: boolean = false) {
    if (!this.signer) return [[bn(0)], bn(0)]
    const { stepsToSwap, value } = this.convertStepForPoolErc1155(this.formatSwapSteps(steps))
    if (isDeleverage) {
      stepsToSwap.unshift(this.getDeleverageStep())
    }

    const res = await this.callStaticMultiSwap({
      steps: stepsToSwap,
      gasLimit,
      value
    })

    const result = []
    for (const i in steps) {
      result.push({ ...steps[i], amountOut: res[0][i] })
    }
    return [result, bn(gasLimit).sub(res.gasLeft)]
  }

  //
  formatSwapSteps(steps: StepType[]): SwapStepType[] {
    const stepsToSwap = []
    for (const i in steps) {
      const step = steps[i]
      const tokenIn = this.CURRENT_POOL.getTokenByPower(step.tokenIn) || step.tokenIn
      const tokenOut = this.CURRENT_POOL.getTokenByPower(step.tokenOut) || step.tokenOut
      if (step.amountIn.isZero() || !tokenIn || !tokenOut) {
        continue
      }
      stepsToSwap.push({
        tokenIn,
        tokenOut,
        amountIn: step.amountIn,
        amountOutMin: 0
      })
    }
    return stepsToSwap
  }

  async callStaticMultiSwap({
    params,
    // @ts-ignore
    value,
    // @ts-ignore
    gasLimit
  }: any) {
    const contract = this.getRouterContract(this.signer)
    return await contract.callStatic.exec(...params, {
      value: value || bn(0),
      gasLimit: gasLimit || undefined
    })
  }

  convertStepForPoolErc1155(steps: SwapStepType[]): { stepsToSwap: PoolErc1155StepType[], value: BigNumber } {
    let value = bn(0)
    steps.forEach((step) => {
      if (step.tokenIn === CONFIGS[this.chainId].nativeToken) {
        value = value.add(step.amountIn)
      }
    })

    const stepsToSwap = steps.map((step) => {
      return {
        idIn: this.getIdByAddress(step.tokenIn),
        idOut: this.getIdByAddress(step.tokenOut),
        amountIn: step.amountIn,
        amountOutMin: step.amountOutMin
      }
    })

    return { stepsToSwap, value }
  }

  async convertStepToActions(steps: SwapStepType[]): Promise<{ params: any, value: BigNumber }> {
    const poolContract = this.getPoolContract()

    const outputs: { eip: number; token: string; id: string | BigNumber; amountOutMin: string | number | BigNumber; recipient: string | undefined; }[] = []
    steps.forEach((step) => {
      outputs.push({
        eip: isErc1155Address(step.tokenOut) ? 1155 : 20,
        token: this.CURRENT_POOL.poolAddress,
        id: this.getIdByAddress(step.tokenOut),
        amountOutMin: step.amountOutMin,
        recipient: this.account,
      })
    })

    const datas = await Promise.all(steps.map((step) => {
      return poolContract.populateTransaction.swap(
        this.getIdByAddress(step.tokenIn),
        this.getIdByAddress(step.tokenOut),
        this.account
      )
    }))

    const actions = steps.map((step, key) => {
      return {
        flags: 0,
        code: this.CURRENT_POOL.poolAddress,
        data: datas[key].data,
        inputs: [{
          mode: TRANSFER_FROM_SENDER,
          recipient: this.CURRENT_POOL.poolAddress,
          eip: isErc1155Address(step.tokenIn) ? 1155 : 20,
          id: isErc1155Address(step.tokenIn) ? this.getIdByAddress(step.tokenIn) : 0,
          token: step.tokenIn,
          amountInMax: step.amountIn,
          amountSource: 0,
        }]
      }
    })


    return { params: [outputs, actions], value: bn(0) }
  }

  getIdByAddress(address: string) {
    try {
      if (address === this.CURRENT_POOL.baseToken) return bn(this.CURRENT_POOL.baseId)
      if (address === this.CURRENT_POOL.quoteToken) return bn(this.CURRENT_POOL.quoteId)
      if (address === CONFIGS[this.chainId].nativeToken) return POOL_IDS.native
      if (address === this.CURRENT_POOL.cToken) return bn(POOL_IDS.cToken)
      return bn(address.split('-')[1])
    } catch (e) {
      throw new Error('Token id not found')
    }
  }

  async multiSwap(steps: SwapStepType[], isDeleverage = false) {
    try {
      const { params, value } = await this.convertStepToActions([...steps])
      if (isDeleverage) {
        params.unshift(this.getDeleverageStep())
      }
      await this.callStaticMultiSwap({ params, value })
      return 1
      const contract = this.getRouterContract(this.signer)
      const tx = await contract.exec(
        params,
        {
          value
        }
      )
      console.log('tx', tx)
      await tx.wait(1)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  async updateLeverageAndSize(rawStep: StepType[], isDeleverage = false) {
    try {
      const steps = this.formatSwapSteps(rawStep)
      return await this.multiSwap(steps, isDeleverage)
    } catch (e) {
      console.error(e)
      return e
    }
  }

  getRouterContract(provider: any) {
    return new ethers.Contract(CONFIGS[this.chainId].router, UtrAbi, provider)
    // return new ethers.Contract(CONFIGS[this.chainId].router, RouterAbi, provider)
  }

  getPoolContract() {
    return new ethers.Contract(this.CURRENT_POOL.poolAddress, PoolAbi, this.provider)
  }
}
