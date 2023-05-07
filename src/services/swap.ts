import {BigNumber, ethers} from "ethers";
import {UniV2Pair} from "./uniV2Pair";
import {PoolErc1155StepType, StepType, SwapStepType} from "../types";
import {bn, isErc1155Address, numberToWei, packId, weiToNumber} from "../utils/helper";
import {LARGE_VALUE, NATIVE_ADDRESS, POOL_IDS, ZERO_ADDRESS} from "../utils/constant";
import {CONFIGS} from "../utils/configs";
import {CurrentPool} from "./currentPool";
import UtrAbi from "../abi/UTR.json";
import LogicsAbi from "../abi/Logic.json";
import UtrOverride from "../abi/UTROverride.json";
import PoolAbi from "../abi/Pool.json";
import HelperAbi from "../abi/Helper.json";
import Erc20Abi from "../abi/ERC20.json";
import WtapAbi from "../abi/Wrap.json";
import {JsonRpcProvider} from "@ethersproject/providers";

type ConfigType = {
  account?: string
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  signer?: ethers.providers.JsonRpcSigner
  UNIV2PAIR: UniV2Pair
  CURRENT_POOL: CurrentPool
}

// TODO: don't hardcode these
const fee10000 = 30

const gasLimit = 6000000
const ACTION_RECORD_CALL_RESULT = 2;
const ACTION_INJECT_CALL_RESULT = 4;
const AMOUNT_EXACT = 0;
const AMOUNT_ALL = 1;
const TRANSFER_FROM_SENDER = 0
const TRANSFER_FROM_ROUTER = 1
const TRANSFER_CALL_VALUE = 2
const IN_TX_PAYMENT = 4

const FROM_ROUTER = 10;
const PAYMENT = 0;
const TRANSFER = 1;
const CALL_VALUE = 2;

const mode = (x: string) => ethers.utils.formatBytes32String(x)

export class Swap {
  account?: string
  chainId: number
  scanApi: string
  provider: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  signer?: ethers.providers.JsonRpcSigner
  UNIV2PAIR: UniV2Pair
  CURRENT_POOL: CurrentPool

  constructor(configs: ConfigType) {
    this.account = configs.account
    this.chainId = configs.chainId
    this.scanApi = configs.scanApi
    this.provider = configs.provider
    this.overrideProvider = configs.overrideProvider
    this.signer = configs.signer
    this.CURRENT_POOL = configs.CURRENT_POOL
  }

  //@ts-ignore
  async calculateAmountOuts(steps: StepType[]) {
    if (!this.signer) return [[bn(0)], bn(0)]
    try {
      const stepsToSwap: SwapStepType[] = [...steps].map((step) => {
        return {...step, amountOutMin: 0}
      })
      const {params, value} = await this.convertStepToActions(stepsToSwap)

      const router = CONFIGS[this.chainId].router
      // @ts-ignore
      this.overrideProvider.setStateOverride({
        [router]: {
          code: UtrOverride.deployedBytecode
        }
      })
      const contract = new ethers.Contract(router, UtrOverride.abi, this.overrideProvider)
      const res = await contract.callStatic.exec(...params, {
        from: this.account,
        value,
        gasLimit: gasLimit || undefined
      })
      const result = []
      for (const i in steps) {
        result.push({...steps[i], amountOut: res[0][i]})
      }
      return [result, bn(gasLimit).sub(res.gasLeft)]
    } catch (e) {
      console.error(e)
      return [[bn(0)], bn(0)]
    }
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
                              value,
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

    return {stepsToSwap, value}
  }

  async convertStepToActions(steps: SwapStepType[]): Promise<{ params: any, value: BigNumber }> {
    const stateCalHelper = this.getStateCalHelperContract(ZERO_ADDRESS)

    let outputs: { eip: number; token: string; id: string | BigNumber; amountOutMin: string | number | BigNumber; recipient: string | undefined; }[] = []
    steps.forEach((step) => {
      outputs.push({
        recipient: this.account,
        eip: isErc1155Address(step.tokenOut)
          ? 1155
          : step.tokenOut === NATIVE_ADDRESS
            ? 0 : 20,
        token: isErc1155Address(step.tokenOut) ? this.CURRENT_POOL.TOKEN : step.tokenOut,
        id: isErc1155Address(step.tokenOut) ? packId(this.getIdByAddress(step.tokenOut).toString(), this.getAddressByErc1155Address(step.tokenOut)) : bn(0),
        amountOutMin: step.amountOutMin,
      })
    })
    let nativeAmountToWrap = bn(0)
    let withdrawWrapToNative = false

    const metaDatas: any = []
    const promises: any = []
    steps.forEach((step) => {
      if ((
          step.tokenIn === CONFIGS[this.chainId].nativeToken ||
          step.tokenOut === CONFIGS[this.chainId].nativeToken
        ) &&
        this.CURRENT_POOL.TOKEN_R !== CONFIGS[this.chainId].wrapToken
      ) {
        throw "This pool do not support swap by native Token"
      }

      const poolIn = this.getAddressByErc1155Address(step.tokenIn)
      const poolOut = this.getAddressByErc1155Address(step.tokenOut)

      let idIn = this.getIdByAddress(step.tokenIn)
      const idOut = this.getIdByAddress(step.tokenOut)
      if (step.tokenIn === CONFIGS[this.chainId].nativeToken) {
        nativeAmountToWrap = nativeAmountToWrap.add(step.amountIn)
      }

      if (step.tokenOut === CONFIGS[this.chainId].nativeToken) {
        withdrawWrapToNative = true
      }

      if (poolIn === poolOut || poolOut === this.CURRENT_POOL.TOKEN_R || poolIn === this.CURRENT_POOL.TOKEN_R) {
        const poolAddress = isErc1155Address(step.tokenIn) ? poolIn : poolOut
        let inputs = [{
          mode: PAYMENT,
          eip: isErc1155Address(step.tokenIn) ? 1155 : 20,
          token: isErc1155Address(step.tokenIn) ? this.CURRENT_POOL.TOKEN : this.CURRENT_POOL.TOKEN_R,
          id: isErc1155Address(step.tokenIn) ? packId(idIn.toString(), poolIn) : 0,
          amountIn: step.amountIn,
          recipient: poolAddress,
        }]
        if (step.tokenIn === CONFIGS[this.chainId].nativeToken) {
          inputs = [{
            mode: CALL_VALUE,
            token: ZERO_ADDRESS,
            eip: 0,
            id: 0,
            amountIn: step.amountIn,
            recipient: ZERO_ADDRESS,
          }]
        }
        metaDatas.push({
          code: CONFIGS[this.chainId].stateCalHelper,
          inputs
        })
        promises.push(stateCalHelper.populateTransaction.swap({
          sideIn: idIn,
          poolIn: poolAddress,
          sideOut: idOut,
          poolOut: poolAddress,
          amountIn: step.amountIn,
          payer: this.account,
          recipient: this.account
        }))
      } else {
        metaDatas.push({
          code: CONFIGS[this.chainId].stateCalHelper,
          inputs: [{
            mode: PAYMENT,
            eip: 1155,
            token: this.CURRENT_POOL.TOKEN,
            id: packId(idIn.toString(), poolIn),
            amountIn: step.amountIn,
            recipient: poolIn,
          }]
        })
        promises.push(
          stateCalHelper.populateTransaction.swap({
            sideIn: idIn,
            poolIn,
            sideOut: idOut,
            poolOut,
            amountIn: step.amountIn,
            payer: this.account,
            recipient: this.account,
            TOKEN: this.CURRENT_POOL.TOKEN
          })
        )
      }
    })
    const datas: any[] = await Promise.all(promises)

    const actions: any[] = []
    //@ts-ignore
    metaDatas.forEach((metaData, key) => {
      actions.push({...metaData, data: datas[key].data})
    })

    // if (nativeAmountToWrap.gt(0)) {
    //   const poolContract = this.getWrapContract()
    //
    //   const data = await poolContract.populateTransaction.deposit()
    //   actions.unshift({
    //     flags: 0,
    //     code: CONFIGS[this.chainId].wrapToken,
    //     //@ts-ignore
    //     data: data.data,
    //     inputs: [{
    //       mode: CALL_VALUE,
    //       eip: 0,
    //       token: ZERO_ADDRESS,
    //       id: 0,
    //       amountIn: nativeAmountToWrap,
    //       recipient: ZERO_ADDRESS,
    //     }]
    //   })
    // }

    return {params: [outputs, actions], value: nativeAmountToWrap}
  }

  getIdByAddress(address: string) {
    try {
      if (address === this.CURRENT_POOL.TOKEN_R) return bn(POOL_IDS.R)
      if (
        address === CONFIGS[this.chainId].nativeToken &&
        this.CURRENT_POOL.TOKEN_R === CONFIGS[this.chainId].wrapToken
      ) {
        return bn(POOL_IDS.native)
      }
      return bn(address.split('-')[1])
    } catch (e) {
      throw new Error('Token id not found')
    }
  }

  async multiSwap(steps: SwapStepType[], gasLimit?: BigNumber) {
    try {
      const {params, value} = await this.convertStepToActions([...steps])

      await this.callStaticMultiSwap({
        params, value, gasLimit
      })
      const contract = this.getRouterContract(this.signer)
      const res = await contract.exec(...params,
        {
          value,
          gasLimit: gasLimit || undefined
        }
      )
      const tx = await res.wait(1)
      console.log('tx', tx)
      return tx
    } catch (e) {
      throw e
    }
  }

  async updateLeverageAndSize(rawStep: StepType[], gasLimit?: BigNumber) {
    try {
      const steps = this.formatSwapSteps(rawStep)
      return await this.multiSwap(steps, gasLimit)
    } catch (e) {
      throw e
    }
  }

  getAddressByErc1155Address(address: string) {
    if (isErc1155Address(address)) {
      return address.split('-')[0]
    }
    if (address === CONFIGS[this.chainId].nativeToken &&
      this.CURRENT_POOL.TOKEN_R === CONFIGS[this.chainId].wrapToken
    ) {
      return CONFIGS[this.chainId].wrapToken
    }

    return address
  }

  getRouterContract(provider: any) {
    return new ethers.Contract(CONFIGS[this.chainId].router, UtrAbi, provider)
  }

  getStateCalHelperContract(address: string, provider?: any) {
    return new ethers.Contract(address, HelperAbi, provider || this.provider)
  }

  getPoolContract(poolAddress: string, provider?: any) {
    return new ethers.Contract(poolAddress, PoolAbi, provider || this.provider)
  }

  getLogicContract(provider?: any) {
    return new ethers.Contract(<string>this.CURRENT_POOL.logicAddress, LogicsAbi, provider || this.provider)
  }

  getWrapContract(provider?: any) {
    return new ethers.Contract(CONFIGS[this.chainId].wrapToken, WtapAbi, provider || this.provider)
  }

  encodePayload(swapType: number, sideIn: BigNumber, sideOut: BigNumber, amount: BigNumber, token1155: string) {
    const abiCoder = new ethers.utils.AbiCoder()
    return abiCoder.encode(
      ["uint", "uint", "uint", "uint", "address"],
      [swapType, sideIn, sideOut, amount, token1155]
    )
  }
}
