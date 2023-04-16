import {BigNumber, ethers} from "ethers";
import {UniV2Pair} from "./uniV2Pair";
import {PoolErc1155StepType, StepType, SwapStepType} from "../types";
import {bn, isErc1155Address, numberToWei, weiToNumber} from "../utils/helper";
import {LARGE_VALUE, POOL_IDS, ZERO_ADDRESS} from "../utils/constant";
import {CONFIGS} from "../utils/configs";
import {CurrentPool} from "./currentPool";
import UtrAbi from "../abi/UTR.json";
import LogicsAbi from "../abi/Logic.json";
import UtrOverride from "../abi/UTROverride.json";
import PoolAbi from "../abi/Pool.json";
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

  async getDeleverageStep(): Promise<any> {
    const {priceScaleLong, twapBase} = this.CURRENT_POOL.states
    const [start, end] = twapBase.lt(priceScaleLong) ?
      [twapBase, priceScaleLong] : [priceScaleLong, twapBase]
    const logicContract = this.getLogicContract()
    const data = (await logicContract.populateTransaction.deleverage(start.div(2), end.mul(2))).data

    return {
      flags: 0,
      code: this.CURRENT_POOL.logicAddress,
      data: data,
      inputs: [{
        mode: 2,
        recipient: this.CURRENT_POOL.poolAddress,
        eip: 0,
        id: 0,
        token: ZERO_ADDRESS,
        amountInMax: 0,
        amountSource: 0,
      }]
    }
  }

  //@ts-ignore
  async calculateAmountOuts(steps: StepType[], isDeleverage: boolean = false) {
    if (!this.signer) return [[bn(0)], bn(0)]
    try {
      const stepsToSwap: SwapStepType[] = [...steps].map((step) => {
        return {...step, amountOutMin: 0}
      })
      const {params, value} = await this.convertStepToActions(stepsToSwap)
      if (isDeleverage) {
        params[1].unshift(await this.getDeleverageStep())
      }

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
      console.log(e)
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
    const poolContract = this.getPoolContract(ZERO_ADDRESS)

    const outputs: { eip: number; token: string; id: string | BigNumber; amountOutMin: string | number | BigNumber; recipient: string | undefined; }[] = []
    // steps.forEach((step) => {
    //   outputs.push({
    //     eip: isErc1155Address(step.tokenOut) ? 1155 : 20,
    //     token: this.getAddressByErc1155Address(step.tokenOut),
    //     id: isErc1155Address(step.tokenOut) ? this.getIdByAddress(step.tokenOut) : bn(0),
    //     amountOutMin: step.amountOutMin,
    //     recipient: this.account,
    //   })
    // })
    let nativeAmountToWrap = bn(0)

    const datas = await Promise.all(steps.map((step) => {
      if (step.tokenIn === CONFIGS[this.chainId].nativeToken &&
        this.CURRENT_POOL.TOKEN_R !== CONFIGS[this.chainId].wrapToken
      ) {
        throw "This pool do not support swap by native Token"
      }

      let idIn = this.getIdByAddress(step.tokenIn)
      if (step.tokenIn === CONFIGS[this.chainId].nativeToken) {
        nativeAmountToWrap = nativeAmountToWrap.add(step.amountIn)
      }

      console.log([
        idIn,
        step.amountIn,
        this.getIdByAddress(step.tokenOut),
        step.tokenIn === CONFIGS[this.chainId].nativeToken ? ZERO_ADDRESS : this.account,
        this.account
      ])

      return poolContract.populateTransaction.exactIn(
        idIn,
        step.amountIn,
        this.getIdByAddress(step.tokenOut),
        step.tokenIn === CONFIGS[this.chainId].nativeToken ? ZERO_ADDRESS : this.account,
        this.account
      )
    }))

    const actions = []
    //@ts-ignore
    steps.forEach((step, key) => {
      // const mode = step.tokenIn === CONFIGS[this.chainId].nativeToken ? TRANSFER_FROM_ROUTER : TRANSFER_FROM_SENDER
      const poolAddress = isErc1155Address(step.tokenIn)
        ? this.getAddressByErc1155Address(step.tokenIn)
        : this.getAddressByErc1155Address(step.tokenOut)
      actions.push({
        flags: 0,
        code: poolAddress,
        data: '0x',
        inputs: [{
          mode: step.tokenIn === CONFIGS[this.chainId].nativeToken ? mode('ROUTER_APPROVE') : mode('ROUTER_PAY'),
          eip: isErc1155Address(step.tokenIn) ? 1155 : 20,
          token: this.getAddressByErc1155Address(step.tokenIn),
          id: isErc1155Address(step.tokenIn) ? this.getIdByAddress(step.tokenIn) : 0,
          amountSource: AMOUNT_EXACT,
          amountInMax: step.amountIn,
          recipient: poolAddress,
        }]
      })
    })

    if (nativeAmountToWrap.gt(0)) {
      const poolContract = this.getWrapContract()

      const data = await poolContract.populateTransaction.deposit()
      actions.unshift({
        flags: 0,
        code: CONFIGS[this.chainId].wrapToken,
        //@ts-ignore
        data: data.data,
        inputs: [{
          mode: mode('CALL_VALUE'),
          eip: 0,
          token: ZERO_ADDRESS,
          id: 0,
          amountInMax: nativeAmountToWrap,
          amountSource: AMOUNT_EXACT,
          recipient: ZERO_ADDRESS,
        }]
      })
    }

    return {params: [outputs, actions], value: nativeAmountToWrap}
  }

  getIdByAddress(address: string) {
    try {
      if (address === this.CURRENT_POOL.TOKEN_R) return bn(POOL_IDS.R)
      if (
        address === CONFIGS[this.chainId].nativeToken &&
        this.CURRENT_POOL.TOKEN_R === CONFIGS[this.chainId].wrapToken
      ) {
        return bn(POOL_IDS.R)
      }
      return bn(address.split('-')[1])
    } catch (e) {
      throw new Error('Token id not found')
    }
  }

  async multiSwap(steps: SwapStepType[], gasLimit?: BigNumber, isDeleverage = false) {
    try {
      const {params, value} = await this.convertStepToActions([...steps])
      if (isDeleverage) {
        params.unshift(this.getDeleverageStep())
      }

      // const weth = new ethers.Contract(this.CURRENT_POOL.TOKEN_R, WtapAbi, this.signer)
      // await weth.approve('0x1351ad85168aE8d095c8eC6Af0C5333d7A4929d0', LARGE_VALUE)
      // const a = await weth.allowance(this.account, '0xd84E414f35E6661B25eE98A87428d108e3056661')
      // const b = await weth.balanceOf(this.account)
      // const c = weiToNumber(b)
      // const d = weiToNumber(a)

      // const derivablePool = this.getPoolContract('0x1351ad85168aE8d095c8eC6Af0C5333d7A4929d0', this.signer)
      //
      // await derivablePool.exactIn(
      //   POOL_IDS.R,
      //   numberToWei(1),
      //   POOL_IDS.C,
      //   ZERO_ADDRESS,
      //   this.account,
      //   {
      //     gasLimit: 3_000_000
      //   }
      // )

      await this.callStaticMultiSwap({ params, value, gasLimit })
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

  async updateLeverageAndSize(rawStep: StepType[], gasLimit?: BigNumber, isDeleverage = false) {
    try {
      const steps = this.formatSwapSteps(rawStep)
      return await this.multiSwap(steps, gasLimit, isDeleverage)
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

  getPoolContract(poolAddress: string, provider?: any) {
    return new ethers.Contract(poolAddress, PoolAbi, provider || this.provider)
  }

  getLogicContract(provider?: any) {
    return new ethers.Contract(<string>this.CURRENT_POOL.logicAddress, LogicsAbi, provider || this.provider)
  }

  getWrapContract(provider?: any) {
    return new ethers.Contract(CONFIGS[this.chainId].wrapToken, WtapAbi, provider || this.provider)
  }
}
