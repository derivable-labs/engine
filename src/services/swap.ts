import { BigNumber, ethers } from 'ethers'
import { UniV2Pair } from './uniV2Pair'
import { PoolErc1155StepType, StepType, SwapStepType } from '../types'
import {
  bn,
  isErc1155Address,
  numberToWei,
  packId,
  weiToNumber,
} from '../utils/helper'
import {
  LARGE_VALUE,
  NATIVE_ADDRESS,
  POOL_IDS,
  ZERO_ADDRESS,
} from '../utils/constant'
import { CurrentPool } from './currentPool'
import UtrAbi from '../abi/UTR.json'
import LogicsAbi from '../abi/Logic.json'
import UtrOverride from '../abi/UTROverride.json'
import PoolAbi from '../abi/Pool.json'
import HelperAbi from '../abi/Helper.json'
import Erc20Abi from '../abi/ERC20.json'
import WtapAbi from '../abi/Wrap.json'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ConfigType } from './setConfig'

// type ConfigType = {
//   account?: string
//   chainId: number
//   scanApi: string
//   provider: ethers.providers.Provider
//   overrideProvider: JsonRpcProvider
//   signer?: ethers.providers.JsonRpcSigner
//   UNIV2PAIR: UniV2Pair
//   CURRENT_POOL: CurrentPool
// }

// TODO: don't hardcode these
const fee10000 = 30

const gasLimit = 6000000
const ACTION_RECORD_CALL_RESULT = 2
const ACTION_INJECT_CALL_RESULT = 4
const AMOUNT_EXACT = 0
const AMOUNT_ALL = 1
const TRANSFER_FROM_SENDER = 0
const TRANSFER_FROM_ROUTER = 1
const TRANSFER_CALL_VALUE = 2
const IN_TX_PAYMENT = 4

const FROM_ROUTER = 10
const PAYMENT = 0
const TRANSFER = 1
const CALL_VALUE = 2

const mode = (x: string) => ethers.utils.formatBytes32String(x)

export class Swap {
  account?: string
  chainId: number
  scanApi?: string
  provider: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  signer?: ethers.providers.JsonRpcSigner
  UNIV2PAIR: UniV2Pair
  CURRENT_POOL: CurrentPool
  config: ConfigType
  constructor(config: ConfigType & { CURRENT_POOL: CurrentPool }) {
    this.config = config
    this.account = config.account
    this.chainId = config.chainId
    this.scanApi = config.scanApi
    this.provider = config.provider
    this.overrideProvider = config.overrideProvider
    this.signer = config.signer
    this.CURRENT_POOL = config.CURRENT_POOL
  }

  //@ts-ignore
  async calculateAmountOuts(steps: StepType[]) {
    if (!this.signer) return [[bn(0)], bn(0)]
    try {
      const stepsToSwap: SwapStepType[] = [...steps].map((step) => {
        return { ...step, amountOutMin: 0 }
      })
      const { params, value } = await this.convertStepToActions(stepsToSwap)

      const router = this.config.addresses.router as string
      // @ts-ignore
      this.overrideProvider.setStateOverride({
        [router]: {
          code: UtrOverride.deployedBytecode,
        },
      })
      const contract = new ethers.Contract(
        router,
        UtrOverride.abi,
        this.overrideProvider,
      )
      const res = await contract.callStatic.exec(...params, {
        from: this.account,
        value,
        gasLimit: gasLimit || undefined,
      })
      const result = []
      for (const i in steps) {
        result.push({ ...steps[i], amountOut: res[0][i] })
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
      const tokenIn =
        this.CURRENT_POOL.getTokenByPower(step.tokenIn) || step.tokenIn
      const tokenOut =
        this.CURRENT_POOL.getTokenByPower(step.tokenOut) || step.tokenOut
      if (step.amountIn.isZero() || !tokenIn || !tokenOut) {
        continue
      }
      stepsToSwap.push({
        tokenIn,
        tokenOut,
        amountIn: step.amountIn,
        amountOutMin: 0,
      })
    }
    return stepsToSwap
  }

  async callStaticMultiSwap({ params, value, gasLimit }: any) {
    const contract = this.getRouterContract(this.signer)
    return await contract.callStatic.exec(...params, {
      value: value || bn(0),
      gasLimit: gasLimit || undefined,
    })
  }

  // convertStepForPoolErc1155(steps: SwapStepType[]): {
  //   stepsToSwap: PoolErc1155StepType[]
  //   value: BigNumber
  // } {
  //   let value = bn(0)
  //   steps.forEach((step) => {
  //     if (step.tokenIn === NATIVE_ADDRESS) {
  //       value = value.add(step.amountIn)
  //     }
  //   })
  //
  //   const stepsToSwap = steps.map((step) => {
  //     return {
  //       idIn: this.getIdByAddress(step.tokenIn),
  //       idOut: this.getIdByAddress(step.tokenOut),
  //       amountIn: step.amountIn,
  //       amountOutMin: step.amountOutMin,
  //     }
  //   })
  //
  //   return { stepsToSwap, value }
  // }

  async convertStepToActions(
    steps: SwapStepType[],
  ): Promise<{ params: any; value: BigNumber }> {
    const stateCalHelper = this.getStateCalHelperContract(ZERO_ADDRESS)

    let outputs: {
      eip: number
      token: string
      id: string | BigNumber
      amountOutMin: string | number | BigNumber
      recipient: string | undefined
    }[] = []
    steps.forEach((step) => {
      const poolGroup = this.getPoolPoolGroup(step.tokenIn, step.tokenOut)

      outputs.push({
        recipient: this.account,
        eip: isErc1155Address(step.tokenOut)
          ? 1155
          : step.tokenOut === NATIVE_ADDRESS
          ? 0
          : 20,
        token: isErc1155Address(step.tokenOut)
          ? this.CURRENT_POOL.TOKEN
          : step.tokenOut,
        id: isErc1155Address(step.tokenOut)
          ? packId(
              this.getIdByAddress(step.tokenOut, poolGroup.TOKEN_R).toString(),
              this.getAddressByErc1155Address(step.tokenOut, poolGroup.TOKEN_R),
            )
          : bn(0),
        amountOutMin: step.amountOutMin,
      })
    })
    let nativeAmountToWrap = bn(0)
    let withdrawWrapToNative = false

    const metaDatas: any = []
    const promises: any = []
    steps.forEach((step) => {
      const poolGroup = this.getPoolPoolGroup(step.tokenIn, step.tokenOut)

      if (
        (step.tokenIn === NATIVE_ADDRESS || step.tokenOut === NATIVE_ADDRESS) &&
        poolGroup.TOKEN_R !== this.config.addresses.wrapToken
      ) {
        throw 'This pool do not support swap by native Token'
      }

      const poolIn = this.getAddressByErc1155Address(
        step.tokenIn,
        poolGroup.TOKEN_R,
      )
      const poolOut = this.getAddressByErc1155Address(
        step.tokenOut,
        poolGroup.TOKEN_R,
      )

      let idIn = this.getIdByAddress(step.tokenIn, poolGroup.TOKEN_R)
      const idOut = this.getIdByAddress(step.tokenOut, poolGroup.TOKEN_R)
      if (step.tokenIn === NATIVE_ADDRESS) {
        nativeAmountToWrap = nativeAmountToWrap.add(step.amountIn)
      }

      if (step.tokenOut === NATIVE_ADDRESS) {
        withdrawWrapToNative = true
      }

      if (
        poolIn === poolOut ||
        poolOut === poolGroup.TOKEN_R ||
        poolIn === poolGroup.TOKEN_R
      ) {
        const poolAddress = isErc1155Address(step.tokenIn) ? poolIn : poolOut
        let inputs = [
          {
            mode: PAYMENT,
            eip: isErc1155Address(step.tokenIn) ? 1155 : 20,
            token: isErc1155Address(step.tokenIn)
              ? this.CURRENT_POOL.TOKEN
              : poolGroup.TOKEN_R,
            id: isErc1155Address(step.tokenIn)
              ? packId(idIn.toString(), poolIn)
              : 0,
            amountIn: step.amountIn,
            recipient: poolAddress,
          },
        ]
        if (step.tokenIn === NATIVE_ADDRESS) {
          inputs = [
            {
              mode: CALL_VALUE,
              token: ZERO_ADDRESS,
              eip: 0,
              id: 0,
              amountIn: step.amountIn,
              recipient: ZERO_ADDRESS,
            },
          ]
        }
        metaDatas.push({
          code: this.config.addresses.stateCalHelper,
          inputs,
        })

        console.log({
          sideIn: idIn,
          poolIn: poolAddress,
          sideOut: idOut,
          poolOut: poolAddress,
          amountIn: step.amountIn,
          payer: this.account,
          recipient: this.account,
        })

        promises.push(
          stateCalHelper.populateTransaction.swap({
            sideIn: idIn,
            poolIn: poolAddress,
            sideOut: idOut,
            poolOut: poolAddress,
            amountIn: step.amountIn,
            maturity: 0,
            payer: this.account,
            recipient: this.account,
          }),
        )
      } else {
        metaDatas.push({
          code: this.config.addresses.stateCalHelper,
          inputs: [
            {
              mode: PAYMENT,
              eip: 1155,
              token: this.CURRENT_POOL.TOKEN,
              id: packId(idIn.toString(), poolIn),
              amountIn: step.amountIn,
              recipient: poolIn,
            },
          ],
        })
        console.log({ sideIn: idIn,
          poolIn,
          sideOut: idOut,
          poolOut,
          amountIn: step.amountIn,
          maturity: 0,
          payer: this.account,
          recipient: this.account
        })
        promises.push(
          stateCalHelper.populateTransaction.swap({
            sideIn: idIn,
            poolIn,
            sideOut: idOut,
            poolOut,
            amountIn: step.amountIn,
            maturity: 0,
            payer: this.account,
            recipient: this.account
          }),
        )
      }
    })
    const datas: any[] = await Promise.all(promises)

    const actions: any[] = []
    //@ts-ignore
    metaDatas.forEach((metaData, key) => {
      actions.push({ ...metaData, data: datas[key].data })
    })

    // if (nativeAmountToWrap.gt(0)) {
    //   const poolContract = this.getWrapContract()
    //
    //   const data = await poolContract.populateTransaction.deposit()
    //   actions.unshift({
    //     flags: 0,
    //     code: this.config.wrapToken,
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

    return { params: [outputs, actions], value: nativeAmountToWrap }
  }

  getIdByAddress(address: string, TOKEN_R: string) {
    try {
      if (address === TOKEN_R) return bn(POOL_IDS.R)
      if (
        address === NATIVE_ADDRESS &&
        TOKEN_R === this.config.addresses.wrapToken
      ) {
        return bn(POOL_IDS.native)
      }
      return bn(address.split('-')[1])
    } catch (e) {
      throw new Error('Token id not found')
    }
  }

  getPoolPoolGroup(addressIn: string, addressOut: string) {
    const poolIn = isErc1155Address(addressIn)
      ? this.CURRENT_POOL.pools[addressIn.split('-')[0]]
      : null

    const poolOut = isErc1155Address(addressOut)
      ? this.CURRENT_POOL.pools[addressOut.split('-')[0]]
      : null

    if (!poolIn && !poolOut) {
      throw 'Cannot detect pool to swap'
    }

    if (poolIn && poolOut && poolIn.TOKEN_R !== poolOut.TOKEN_R) {
      throw 'Cannot swap throw multi pool (need to same Token R)'
    }

    const result = { pools: {}, TOKEN_R: '' }
    if (poolIn) {
      result.pools[poolIn.poolAddress] = poolIn
      result.TOKEN_R = poolIn.TOKEN_R
    }
    if (poolOut) {
      result.pools[poolOut.poolAddress] = poolOut
      result.TOKEN_R = poolOut.TOKEN_R
    }

    return result
  }

  async multiSwap(steps: SwapStepType[], gasLimit?: BigNumber) {
    try {
      const { params, value } = await this.convertStepToActions([...steps])

      await this.callStaticMultiSwap({
        params,
        value,
        gasLimit,
      })
      const contract = this.getRouterContract(this.signer)
      const res = await contract.exec(...params, {
        value,
        gasLimit: gasLimit || undefined,
      })
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

  getAddressByErc1155Address(address: string, TOKEN_R: string) {
    if (isErc1155Address(address)) {
      return address.split('-')[0]
    }
    if (
      address === NATIVE_ADDRESS &&
      TOKEN_R === this.config.addresses.wrapToken
    ) {
      return this.config.addresses.wrapToken
    }

    return address
  }

  getRouterContract(provider: any) {
    return new ethers.Contract(
      this.config.addresses.router as string,
      UtrAbi,
      provider,
    )
  }

  getStateCalHelperContract(address: string, provider?: any) {
    return new ethers.Contract(address, HelperAbi, provider || this.provider)
  }

  getPoolContract(poolAddress: string, provider?: any) {
    return new ethers.Contract(poolAddress, PoolAbi, provider || this.provider)
  }

  getLogicContract(provider?: any) {
    return new ethers.Contract(
      <string>this.CURRENT_POOL.logicAddress,
      LogicsAbi,
      provider || this.provider,
    )
  }

  getWrapContract(provider?: any) {
    return new ethers.Contract(
      this.config.addresses.wrapToken as string,
      WtapAbi,
      provider || this.provider,
    )
  }

  encodePayload(
    swapType: number,
    sideIn: BigNumber,
    sideOut: BigNumber,
    amount: BigNumber,
  ) {
    const abiCoder = new ethers.utils.AbiCoder()
    return abiCoder.encode(
      ['uint', 'uint', 'uint', 'uint'],
      [swapType, sideIn, sideOut, amount],
    )
  }
}
