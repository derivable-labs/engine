import {BigNumber, Contract, ethers} from 'ethers'
import {PoolType, SwapStepType, PendingSwapTransactionType} from '../types'
import {bn, isErc1155Address, packId} from '../utils/helper'
import {NATIVE_ADDRESS, POOL_IDS, ZERO_ADDRESS} from '../utils/constant'
import {JsonRpcProvider, TransactionReceipt} from '@ethersproject/providers'
import {Profile} from '../profile'
import {isAddress} from 'ethers/lib/utils'
import {IDerivableContractAddress, IEngineConfig} from '../utils/configs'
import {Resource} from './resource'
import * as OracleSdkAdapter from '../utils/OracleSdkAdapter'
import * as OracleSdk from '../utils/OracleSdk'


const PAYMENT = 0
const TRANSFER = 1
const CALL_VALUE = 2

export class Swap {
  account?: string
  chainId: number
  scanApi?: string
  provider: ethers.providers.Provider
  providerGetProof: JsonRpcProvider
  overrideProvider: JsonRpcProvider
  signer?: ethers.providers.JsonRpcSigner
  RESOURCE: Resource
  config: IEngineConfig
  profile: Profile
  derivableAdr: IDerivableContractAddress
  pendingTxs: PendingSwapTransactionType[]

  constructor(config: IEngineConfig & { RESOURCE: Resource }, profile: Profile) {
    this.config = config
    this.account = config.account
    this.chainId = config.chainId
    this.scanApi = profile.configs.scanApi
    this.provider = new ethers.providers.JsonRpcProvider(profile.configs.rpc)
    this.overrideProvider = new JsonRpcProvider(profile.configs.rpc)
    this.providerGetProof = new JsonRpcProvider(profile.configs.rpcGetProof || profile.configs.rpc)
    this.signer = config.signer
    this.RESOURCE = config.RESOURCE
    this.profile = profile
    this.derivableAdr = profile.configs.derivable
  }

  async calculateAmountOuts(steps: SwapStepType[], fetcherV2 = false): Promise<any> {
    if (!this.signer) return [[bn(0)], bn(0)]
    try {
      const stepsToSwap: SwapStepType[] = [...steps].map((step) => {
        return {...step, amountOutMin: 0}
      })
      const {params, value} = await this.convertStepToActions(stepsToSwap, fetcherV2, true)

      const router = this.profile.configs.helperContract.utr as string

      const contract = new ethers.Contract(router, this.profile.getAbi('UTROverride').abi, this.getOverrideProvider())
      const res = await contract.callStatic.exec(...params, {
        from: this.account,
        value,
        gasLimit: this.profile.configs.gasLimitDefault,
      })
      const result = []
      for (const i in steps) {
        result.push({...steps[i], amountOut: res[0][i]})
      }
      return [result, bn(this.profile.configs.gasLimitDefault).sub(res.gasLeft)]
    } catch (e) {
      if (e?.reason === "OLD" && !fetcherV2) {
        return this.calculateAmountOuts(steps, true)
      }
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

  async convertStepToActions(steps: SwapStepType[], submitFetcherV2: boolean, isCalculate = false): Promise<{
    params: any;
    value: BigNumber
  }> {
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
        eip: isErc1155Address(step.tokenOut) ? 1155 : step.tokenOut === NATIVE_ADDRESS ? 0 : 20,
        token: isErc1155Address(step.tokenOut) ? (this.derivableAdr.token as string) : step.tokenOut,
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
    const fetcherData = {}
    steps.forEach((step) => {
      const poolGroup = this.getPoolPoolGroup(step.tokenIn, step.tokenOut)

      if (
        (step.tokenIn === NATIVE_ADDRESS || step.tokenOut === NATIVE_ADDRESS) &&
        poolGroup.TOKEN_R !== this.profile.configs.wrappedTokenAddress
      ) {
        throw 'This pool do not support swap by native Token'
      }

      const poolIn = this.getAddressByErc1155Address(step.tokenIn, poolGroup.TOKEN_R)
      const poolOut = this.getAddressByErc1155Address(step.tokenOut, poolGroup.TOKEN_R)

      let idIn = this.getIdByAddress(step.tokenIn, poolGroup.TOKEN_R)
      const idOut = this.getIdByAddress(step.tokenOut, poolGroup.TOKEN_R)
      if (step.tokenIn === NATIVE_ADDRESS) {
        nativeAmountToWrap = nativeAmountToWrap.add(step.amountIn)
      }

      if (step.useSweep && isErc1155Address(step.tokenOut)) {
        const {inputs, populateTxData} = this.getSweepCallData({step, poolGroup, poolIn, poolOut, idIn, idOut})

        metaDatas.push(
          {
            code: this.derivableAdr.stateCalHelper,
            inputs,
          },
          {
            code: this.derivableAdr.stateCalHelper,
            inputs: [],
          },
        )

        promises.push(...populateTxData)
      } else {
        const {inputs, populateTxData} = this.getSwapCallData({step, poolGroup, poolIn, poolOut, idIn, idOut})
        metaDatas.push({
          code: this.derivableAdr.stateCalHelper,
          inputs,
        })
        promises.push(...populateTxData)
      }

      if (submitFetcherV2) {
        const pool = isErc1155Address(step.tokenIn) ? this.RESOURCE.pools[poolIn] : this.RESOURCE.pools[poolOut]
        promises.push(isCalculate ? this.fetchPriceMockTx(pool) : this.fetchPriceTx(pool) )
      }
    })
    const datas: any[] = await Promise.all(promises)

    const actions: any[] = []
    //@ts-ignore
    metaDatas.forEach((metaData, key) => {
      actions.push({...metaData, data: datas[key].data})
    })

    if (submitFetcherV2) {
      // data in last of `datas` is submitFetchV2 data
      for (let i = metaDatas.length; i < datas.length; i++) {
        actions.unshift(datas[datas.length - 1])
      }
    }

    return {params: [outputs, actions], value: nativeAmountToWrap}
  }

  getSweepCallData({
                     step,
                     poolGroup,
                     poolIn,
                     poolOut,
                     idIn,
                     idOut,
                   }: {
    step: any
    poolGroup: any
    poolIn: string
    poolOut: string
    idIn: BigNumber
    idOut: BigNumber
  }) {
    const stateCalHelper = this.getStateCalHelperContract()

    const swapCallData = this.getSwapCallData({step, poolGroup, poolIn, poolOut, idIn, idOut})

    let inputs = [
      {
        mode: TRANSFER,
        eip: 1155,
        token: this.derivableAdr.token,
        id: packId(idOut + '', poolOut),
        amountIn: step.currentBalanceOut,
        recipient: stateCalHelper.address,
      },
      ...swapCallData.inputs,
    ]

    const populateTxData = [
      ...swapCallData.populateTxData,
      stateCalHelper.populateTransaction.sweep(packId(idOut + '', poolOut), this.account),
    ]

    return {
      inputs,
      populateTxData,
    }
  }

  getSwapCallData({
                    step,
                    poolGroup,
                    poolIn,
                    poolOut,
                    idIn,
                    idOut,
                  }: {
    step: SwapStepType
    poolGroup: any
    poolIn: string
    poolOut: string
    idIn: BigNumber
    idOut: BigNumber
  }) {
    let inputs = [
      {
        mode: PAYMENT,
        eip: isErc1155Address(step.tokenIn) ? 1155 : 20,
        token: isErc1155Address(step.tokenIn) ? this.derivableAdr.token : step.tokenIn,
        id: isErc1155Address(step.tokenIn) ? packId(idIn.toString(), poolIn) : 0,
        amountIn: step.amountIn,
        recipient:
          isAddress(step.tokenIn) && this.wrapToken(step.tokenIn) !== poolGroup.TOKEN_R
            ? this.getUniPool(step.tokenIn, poolGroup.TOKEN_R)
            : isErc1155Address(step.tokenIn)
              ? poolIn
              : poolOut,
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
      populateTxData.push(
        this.generateSwapParams('swapAndOpen', {
          side: idOut,
          deriPool: poolOut,
          uniPool: this.getUniPool(step.tokenIn, poolGroup.TOKEN_R),
          token: step.tokenIn,
          amount: step.payloadAmountIn ? step.payloadAmountIn : step.amountIn,
          payer: this.account,
          recipient: this.account,
          INDEX_R: this.getIndexR(poolGroup.TOKEN_R),
        }),
      )
    } else if (isAddress(step.tokenOut) && this.wrapToken(step.tokenOut) !== poolGroup.TOKEN_R) {
      populateTxData.push(
        this.generateSwapParams('closeAndSwap', {
          side: idIn,
          deriPool: poolIn,
          uniPool: this.getUniPool(step.tokenOut, poolGroup.TOKEN_R),
          token: step.tokenOut,
          amount: step.payloadAmountIn ? step.payloadAmountIn : step.amountIn,
          payer: this.account,
          recipient: this.account,
          INDEX_R: this.getIndexR(poolGroup.TOKEN_R),
        }),
      )
    } else {
      populateTxData.push(
        this.generateSwapParams('swap', {
          sideIn: idIn,
          poolIn: isErc1155Address(step.tokenIn) ? poolIn : poolOut,
          sideOut: idOut,
          poolOut: isErc1155Address(step.tokenOut) ? poolOut : poolIn,
          amountIn: step.payloadAmountIn ? step.payloadAmountIn : step.amountIn,
          maturity: 0,
          payer: this.account,
          recipient: this.account,
          INDEX_R: this.getIndexR(poolGroup.TOKEN_R),
        }),
      )
    }
    return {
      inputs,
      populateTxData,
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
    const functionInterface = Object.values(stateCalHelper.interface.functions).find((f: any) => f.name === method)?.inputs[0].components
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
      } else if (address === NATIVE_ADDRESS && TOKEN_R === this.profile.configs.wrappedTokenAddress) {
        return bn(POOL_IDS.native)
      }
      return bn(0)
    } catch (e) {
      throw new Error('Token id not found')
    }
  }

  getPoolPoolGroup(addressIn: string, addressOut: string) {
    const poolIn = isErc1155Address(addressIn) ? this.RESOURCE.pools[addressIn.split('-')[0]] : null

    const poolOut = isErc1155Address(addressOut) ? this.RESOURCE.pools[addressOut.split('-')[0]] : null

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

  async multiSwap(
    steps: SwapStepType[],
    gasLimit?: BigNumber,
    submitFetcherV2 = false,
    onSubmitted?: (pendingTx: PendingSwapTransactionType) => void,
  ): Promise<TransactionReceipt> {
    try {
      const {params, value} = await this.convertStepToActions([...steps], submitFetcherV2)

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
      if (onSubmitted) {
        onSubmitted({hash: res.hash, steps})
      }
      const tx = await res.wait(1)
      console.log('tx', tx)
      return tx
    } catch (e) {
      if (e?.reason === "OLD" && !submitFetcherV2) {
        return this.multiSwap(steps, gasLimit, true, onSubmitted)
      }
      throw e
    }
  }

  getAddressByErc1155Address(address: string, TOKEN_R: string) {
    if (isErc1155Address(address)) {
      return address.split('-')[0]
    }
    if (address === NATIVE_ADDRESS && TOKEN_R === this.profile.configs.wrappedTokenAddress) {
      return this.profile.configs.wrappedTokenAddress
    }

    return address
  }

  getRouterContract(provider: any) {
    return new ethers.Contract(this.profile.configs.helperContract.utr as string, this.profile.getAbi('UTR'), provider)
  }

  getStateCalHelperContract(provider?: any) {
    return new ethers.Contract(this.derivableAdr.stateCalHelper as string, this.profile.getAbi('Helper'), provider || this.provider)
  }

  getIndexR(tokenR: string) {
    const routeKey = Object.keys(this.profile.routes).find((r) => {
      return [
        ...this.profile.configs.stablecoins.map((stablecoin) => stablecoin + '-' + tokenR),
        ...this.profile.configs.stablecoins.map((stablecoin) => tokenR + '-' + stablecoin),
      ].includes(r)
    })
    const pool = this.profile.routes[routeKey || ''] ? this.profile.routes[routeKey || ''][0] : undefined
    return pool?.address ? bn(ethers.utils.hexZeroPad(bn(1).shl(255).add(pool.address).toHexString(), 32)) : bn(0)
  }

  getUniPool(tokenIn: string, tokenR: string) {
    const routeKey = Object.keys(this.profile.routes).find((r) => {
      return r === tokenR + '-' + tokenIn || r === tokenIn + '-' + tokenR
    })
    if (!this.profile.routes[routeKey || ''] || !this.profile.routes[routeKey || ''][0].address) {
      console.error(`Can't find router, please select other token`)
      throw `Can't find router, please select other token`
    }
    return this.profile.routes[routeKey || ''][0].address
  }

  async fetchPriceTx(pool: PoolType) {
    const blockNumber = await this.provider.getBlockNumber()
    const getStorageAt = OracleSdkAdapter.getStorageAtFactory(this.overrideProvider)
    const getProof = OracleSdkAdapter.getProofFactory(this.providerGetProof)
    const getBlockByNumber = OracleSdkAdapter.getBlockByNumberFactory(this.overrideProvider)
    // get the proof from the SDK
    const proof = await OracleSdk.getProof(
      getStorageAt,
      getProof,
      getBlockByNumber,
      BigInt(pool.pair),
      BigInt(pool.quoteToken),
      bn(blockNumber).sub(pool.window.toNumber() >> 1).toBigInt()
    )
    // Connect to the network
    const contractWithSigner = new Contract(pool.FETCHER, this.profile.getAbi('FetcherV2'), this.signer)
    const data = await contractWithSigner.populateTransaction.submit(pool.ORACLE, proof)
    return {
      inputs: [],
      code: pool.FETCHER,
      data: data.data,
    }
  }

  async fetchPriceMockTx(pool: PoolType) {
    const blockNumber = await this.provider.getBlockNumber()
    const targetBlock = bn(blockNumber).sub(pool.window.toNumber() >> 1)
    const timestamp = (await this.provider.getBlock(targetBlock.toNumber())).timestamp
    const getStorageAt = OracleSdkAdapter.getStorageAtFactory(this.overrideProvider)
    const getBlockByNumber = OracleSdkAdapter.getBlockByNumberFactory(this.overrideProvider)
    const accumulatorPrice = await OracleSdk.getAccumulatorPrice(
      getStorageAt,
      getBlockByNumber,
      BigInt(pool.pair),
      pool.quoteTokenIndex,
      targetBlock.toBigInt()
    )

    // Connect to the network
    const contractWithSigner = new Contract(pool.FETCHER, this.profile.getAbi('FetcherV2Mock').abi, this.signer)
    const data = await contractWithSigner.populateTransaction.submitPrice(
      pool.ORACLE,
      bn(accumulatorPrice),
      targetBlock.toBigInt(),
      timestamp
    )
    return {
      inputs: [],
      code: pool.FETCHER,
      data: data.data,
    }
  }

  getOverrideProvider() {
    const router = this.profile.configs.helperContract.utr as string
    const fetcherV2 = this.profile.configs.derivable.uniswapV2Fetcher as string
    this.overrideProvider.setStateOverride({
      [router]: {
        code: this.profile.getAbi('UTROverride').deployedBytecode,
      },
      ...(fetcherV2 ? {
        [fetcherV2]: {
          code: this.profile.getAbi('FetcherV2Mock').deployedBytecode,
        }
      } : {})
    })
    return this.overrideProvider
  }
}
