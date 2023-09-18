import {BigNumber, ethers} from 'ethers'
import {SwapStepType} from '../types'
import {
  bn,
  isErc1155Address,
  packId,
} from '../utils/helper'
import {
  NATIVE_ADDRESS,
  POOL_IDS,
  ZERO_ADDRESS,
} from '../utils/constant'
import {CurrentPool} from './currentPool'
import {JsonRpcProvider} from '@ethersproject/providers'
import {Profile} from "../profile";
import {isAddress} from "ethers/lib/utils";
import {IDerivableContractAddress, IEngineConfig} from "../utils/configs";

const PAYMENT = 0
const TRANSFER = 1
const CALL_VALUE = 2

export class Swap {
  account?: string
  chainId: number
  scanApi?: string
  provider: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  signer?: ethers.providers.JsonRpcSigner
  CURRENT_POOL: CurrentPool
  config: IEngineConfig
  profile: Profile
  derivableAdr: IDerivableContractAddress

  constructor(config: IEngineConfig & { CURRENT_POOL: CurrentPool }, profile: Profile) {
    this.config = config
    this.account = config.account
    this.chainId = config.chainId
    this.scanApi = profile.configs.scanApi
    this.provider = new JsonRpcProvider(profile.configs.rpc)
    this.provider = new ethers.providers.JsonRpcProvider(profile.configs.rpc)
    this.overrideProvider = new JsonRpcProvider(profile.configs.rpc)
    this.signer = config.signer
    this.CURRENT_POOL = config.CURRENT_POOL
    this.profile = profile
    this.derivableAdr = profile.configs.derivable
  }

  //@ts-ignore
  async calculateAmountOuts(steps: SwapStepType[]) {
    if (!this.signer) return [[bn(0)], bn(0)]
    try {
      const stepsToSwap: SwapStepType[] = [...steps].map((step) => {
        return {...step, amountOutMin: 0}
      })
      const {params, value} = await this.convertStepToActions(stepsToSwap)

      const router = this.profile.configs.helperContract.utr as string
      // @ts-ignore
      this.overrideProvider.setStateOverride({
        [router]: {
          code: this.profile.getAbi('UTROverride').deployedBytecode,
        },
      })
      const contract = new ethers.Contract(
        router,
        this.profile.getAbi('UTROverride').abi,
        this.overrideProvider,
      )
      const res = await contract.callStatic.exec(...params, {
        from: this.account,
        value,
        gasLimit: this.profile.configs.gasLimitDefault || undefined,
      })
      const result = []
      for (const i in steps) {
        result.push({...steps[i], amountOut: res[0][i]})
      }
      return [result, bn(this.profile.configs.gasLimitDefault).sub(res.gasLeft)]
    } catch (e) {
      throw e
    }
  }

  async callStaticMultiSwap({params, value, gasLimit}: any) {
    const contract = this.getRouterContract(this.signer)
    return await contract.callStatic.exec(...params, {
      value: value || bn(0),
      gasLimit: gasLimit || undefined,
    })
  }

  async convertStepToActions(
    steps: SwapStepType[],
  ): Promise<{ params: any; value: BigNumber }> {
    // @ts-ignore
    const stateCalHelper = this.getStateCalHelperContract()

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
          ? this.derivableAdr.token as string
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

    const metaDatas: any = []
    const promises: any = []
    steps.forEach((step) => {
      const poolGroup = this.getPoolPoolGroup(step.tokenIn, step.tokenOut)

      if (
        (step.tokenIn === NATIVE_ADDRESS || step.tokenOut === NATIVE_ADDRESS) &&
        poolGroup.TOKEN_R !== this.profile.configs.wrappedTokenAddress
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

      if (step.useSweep && isErc1155Address(step.tokenOut)) {
        const {inputs, populateTxData} = this.getSweepCallData({step, poolGroup, poolIn, poolOut, idIn, idOut})

        metaDatas.push({
          code: this.derivableAdr.stateCalHelper,
          inputs,
        }, {
          code: this.derivableAdr.stateCalHelper,
          inputs: []
        })

        promises.push(...populateTxData)
      } else {
        const {inputs, populateTxData} = this.getSwapCallData({step, poolGroup, poolIn, poolOut, idIn, idOut})
        metaDatas.push({
          code: this.derivableAdr.stateCalHelper,
          inputs,
        })
        promises.push(...populateTxData)
      }
    })
    const datas: any[] = await Promise.all(promises)

    const actions: any[] = []
    //@ts-ignore
    metaDatas.forEach((metaData, key) => {
      actions.push({...metaData, data: datas[key].data})
    })

    return {params: [outputs, actions], value: nativeAmountToWrap}
  }


  getSweepCallData({step, poolGroup, poolIn, poolOut, idIn, idOut}: {
    step: any, poolGroup: any, poolIn: string, poolOut: string, idIn: BigNumber, idOut: BigNumber
  }) {
    const stateCalHelper = this.getStateCalHelperContract()

    let inputs = [
      {
        mode: TRANSFER,
        eip: 1155,
        token: this.derivableAdr.token,
        id: packId(idOut + '', poolOut),
        amountIn: step.currentBalanceOut,
        recipient: stateCalHelper.address,
      },
      step.tokenIn === NATIVE_ADDRESS ?
        {
          mode: CALL_VALUE,
          token: ZERO_ADDRESS,
          eip: 0,
          id: 0,
          amountIn: step.amountIn,
          recipient: ZERO_ADDRESS,
        }
        :
        {
          mode: PAYMENT,
          eip: isErc1155Address(step.tokenIn) ? 1155 : 20,
          token: isErc1155Address(step.tokenIn)
            ? this.derivableAdr.token
            : poolGroup.TOKEN_R,
          id: isErc1155Address(step.tokenIn)
            ? packId(idIn.toString(), poolIn)
            : 0,
          amountIn: step.amountIn,
          recipient: isErc1155Address(step.tokenIn) ? poolIn : poolOut,
        },
    ]

    const populateTxData = [
      this.generateSwapParams('swap', {
        sideIn: idIn,
        poolIn: isErc1155Address(step.tokenIn) ? poolIn : poolOut,
        sideOut: idOut,
        poolOut: isErc1155Address(step.tokenOut) ? poolOut : poolIn,
        amountIn: step.payloadAmountIn ? step.payloadAmountIn : step.amountIn,
        maturity: 0,
        payer: this.account,
        recipient: this.account,
        INDEX_R: this.getIndexR(poolGroup.TOKEN_R)
      }),
      stateCalHelper.populateTransaction.sweep(
        packId(idOut + '', poolOut),
        this.account
      ),
    ]

    return {
      inputs,
      populateTxData
    }
  }

  getSwapCallData({step, poolGroup, poolIn, poolOut, idIn, idOut}: {
    step: SwapStepType, poolGroup: any, poolIn: string, poolOut: string, idIn: BigNumber, idOut: BigNumber
  }) {
    if (!step.uniPool && (
      (isAddress(step.tokenIn) && this.wrapToken(step.tokenIn) !== poolGroup.TOKEN_R) ||
      (isAddress(step.tokenOut) && this.wrapToken(step.tokenOut) !== poolGroup.TOKEN_R)
    )) {
      throw new Error("Cannot find UniPool to Swap token")
    }

    let inputs = [
      {
        mode: PAYMENT,
        eip: isErc1155Address(step.tokenIn) ? 1155 : 20,
        token: isErc1155Address(step.tokenIn)
          ? this.derivableAdr.token
          : step.tokenIn,
        id: isErc1155Address(step.tokenIn)
          ? packId(idIn.toString(), poolIn)
          : 0,
        amountIn: step.amountIn,
        recipient: isAddress(step.tokenIn) && this.wrapToken(step.tokenIn) !== poolGroup.TOKEN_R
          ? step.uniPool
          : isErc1155Address(step.tokenIn)
            ? poolIn : poolOut,
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

    const populateTxData = []

    if (isAddress(step.tokenIn) && this.wrapToken(step.tokenIn) !== poolGroup.TOKEN_R) {
      populateTxData.push(this.generateSwapParams('swapAndOpen', {
          side: idOut,
          deriPool: poolOut,
          uniPool: step.uniPool,
          token: step.tokenIn,
          amount: step.payloadAmountIn ? step.payloadAmountIn : step.amountIn,
          payer: this.account,
          recipient: this.account,
          INDEX_R: this.getIndexR(poolGroup.TOKEN_R)
        })
      )
    } else if (isAddress(step.tokenOut) && this.wrapToken(step.tokenOut) !== poolGroup.TOKEN_R) {
      populateTxData.push(this.generateSwapParams('closeAndSwap', {
          side: idIn,
          deriPool: poolIn,
          uniPool: step.uniPool,
          token: step.tokenOut,
          amount: step.payloadAmountIn ? step.payloadAmountIn : step.amountIn,
          payer: this.account,
          recipient: this.account,
          INDEX_R: this.getIndexR(poolGroup.TOKEN_R)
        })
      )
    } else {
      populateTxData.push(this.generateSwapParams('swap', {
          sideIn: idIn,
          poolIn: isErc1155Address(step.tokenIn) ? poolIn : poolOut,
          sideOut: idOut,
          poolOut: isErc1155Address(step.tokenOut) ? poolOut : poolIn,
          amountIn: step.payloadAmountIn ? step.payloadAmountIn : step.amountIn,
          maturity: 0,
          payer: this.account,
          recipient: this.account,
          INDEX_R: this.getIndexR(poolGroup.TOKEN_R)
        })
      )
    }
    return {
      inputs,
      populateTxData
    }
  }

  wrapToken(address: string) {
    if (address === NATIVE_ADDRESS) {
      return this.profile.configs.wrappedTokenAddress
    }

    return address
  }

  generateSwapParams(method: string, params: any) {
    const stateCalHelper = this.getStateCalHelperContract()
    const functionInterface = Object.values(stateCalHelper.interface.functions)
      .find((f: any) => f.name === method)
      ?.inputs[0]
      .components
    const formatedParams = {}
    for (let name in params) {
      if (functionInterface?.find((c) => c.name === name)) {
        formatedParams[name] = params[name]
      }
    }

    return stateCalHelper.populateTransaction[method](formatedParams)
  }

  getIdByAddress(address: string, TOKEN_R: string) {
    try {
      if (isErc1155Address(address)) {
        return bn(address.split('-')[1])
      } else if (address === TOKEN_R) {
        return bn(POOL_IDS.R)
      } else if (
        address === NATIVE_ADDRESS &&
        TOKEN_R === this.profile.configs.wrappedTokenAddress
      ) {
        return bn(POOL_IDS.native)
      }
      return bn(0)
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

    const result = {pools: {}, TOKEN_R: ''}
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
      const {params, value} = await this.convertStepToActions([...steps])

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

  getAddressByErc1155Address(address: string, TOKEN_R: string) {
    if (isErc1155Address(address)) {
      return address.split('-')[0]
    }
    if (
      address === NATIVE_ADDRESS &&
      TOKEN_R === this.profile.configs.wrappedTokenAddress
    ) {
      return this.profile.configs.wrappedTokenAddress
    }

    return address
  }

  getRouterContract(provider: any) {
    return new ethers.Contract(
      this.profile.configs.helperContract.utr as string,
      this.profile.getAbi('UTR'),
      provider,
    )
  }

  getStateCalHelperContract(provider?: any) {
    return new ethers.Contract(
      this.derivableAdr.stateCalHelper as string,
      this.profile.getAbi('Helper'),
      provider || this.provider
    )
  }

  getIndexR(tokenR: string) {
    const routeKey = Object.keys(this.profile.routes).find((r) => {
      return [
        ...this.profile.configs.stablecoins.map((stablecoin) => stablecoin + '-' + tokenR),
        ...this.profile.configs.stablecoins.map((stablecoin) => tokenR + '-' + stablecoin)
      ].includes(r)
    })
    const pool = this.profile.routes[routeKey || ''] ? this.profile.routes[routeKey || ''][0] : undefined
    return pool?.address ? bn(
      ethers.utils.hexZeroPad(
        bn(1).shl(255).add(pool.address).toHexString(),
        32
      )
    ) : bn(0)
  }
}
