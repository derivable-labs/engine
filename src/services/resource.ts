import {BigNumber, ethers} from "ethers";
import {ddlGenesisBlock, EventDataAbis, LOCALSTORAGE_KEY, LP_PRICE_UNIT, POOL_IDS} from "../utils/constant";
import EventsAbi from '../abi/Events.json'
import {Multicall} from "ethereum-multicall";
import {CONFIGS} from "../utils/configs";
import TokensInfoAbi from "../abi/TokensInfo.json";
import {LogType, ParseLogType, PoolsType, PoolType, StatesType, Storage, SwapLog, TokenType} from "../types";
import {
  bn, decodePowers,
  formatMultiCallBignumber,
  getLogicAbi,
  getNormalAddress,
  numberToWei,
  weiToNumber
} from "../utils/helper";
import {UniV2Pair} from "./uniV2Pair";
import {JsonRpcProvider} from "@ethersproject/providers";
import PoolOverride from "../abi/PoolOverride.json";
import {PowerState} from 'powerLib/dist/powerLib';
import _ from "lodash";

const {AssistedJsonRpcProvider} = require('assisted-json-rpc-provider')
const MAX_BLOCK = 4294967295
const TOPIC_APP = ethers.utils.formatBytes32String('DDL')

type ConfigType = {
  chainId: number
  scanApi: string
  account?: string
  storage?: Storage
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  UNIV2PAIR: UniV2Pair
}

type ResourceData = {
  pools: PoolsType
  tokens: TokenType[]
  swapLogs: LogType[]
  poolGroups: any
}

export class Resource {
  poolGroups: any = {}
  pools: PoolsType = {}
  tokens: TokenType[] = []
  swapLogs: LogType[] = []
  chainId: number
  scanApi: string
  account?: string
  storage?: Storage
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  UNIV2PAIR: UniV2Pair

  constructor(configs: ConfigType) {
    this.chainId = configs.chainId
    this.scanApi = configs.scanApi
    this.account = configs.account
    this.storage = configs.storage
    this.account = configs.account
    this.providerToGetLog = configs.providerToGetLog
    this.provider = configs.provider
    this.UNIV2PAIR = configs.UNIV2PAIR
    this.overrideProvider = configs.overrideProvider
  }

  async fetchResourceData(account: string) {
    let result: any = {}
    if (!this.chainId) return result;
    const [resultCached, newResource] = await Promise.all([
      this.getResourceCached(account),
      this.getNewResource(account)
    ])
    this.poolGroups = {...resultCached.poolGroups, ...newResource.poolGroups}
    this.pools = {...resultCached.pools, ...newResource.pools}
    this.tokens = [...resultCached.tokens, ...newResource.tokens]
    this.swapLogs = [...resultCached.swapLogs, ...newResource.swapLogs]
  }

  getLastBlockCached(account: string) {
    if (!this.storage) return ddlGenesisBlock[this.chainId]
    const lastDDlBlock = Number(this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS)) || ddlGenesisBlock[this.chainId] - 1
    let lastWalletBlock = ddlGenesisBlock[this.chainId] - 1
    const walletBlockCached = this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account)
    if (account && walletBlockCached) {
      lastWalletBlock = Number(walletBlockCached)
    }
    return Math.min(lastDDlBlock + 1, lastWalletBlock + 1)
  }

  cacheDdlLog({
                swapLogs,
                ddlLogs,
                headBlock,
                account
              }: {
    swapLogs: any,
    ddlLogs: any,
    headBlock: number,
    account: string
  }) {
    if (!this.storage) return
    const cachedDdlLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.DDL_LOGS) || '[]')
    const newCachedDdlLogs = [...ddlLogs, ...cachedDdlLogs].filter((log, index, self) => {
      return index === self.findIndex((t) => (
        t.logIndex === log.logIndex && t.transactionHash === log.transactionHash
      ))
    })
    this.storage.setItem(this.chainId + '-' + LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS, headBlock.toString())
    this.storage.setItem(this.chainId + '-' + LOCALSTORAGE_KEY.DDL_LOGS, JSON.stringify(newCachedDdlLogs))
    if (account) {
      const cachedSwapLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account) || '[]')
      const newCacheSwapLogs = [...swapLogs, ...cachedSwapLogs].filter((log, index, self) => {
        return index === self.findIndex((t) => (
          t.logIndex === log.logIndex && t.transactionHash === log.transactionHash
        ))
      })

      this.storage.setItem(this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account, headBlock.toString())
      this.storage.setItem(this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account, JSON.stringify(newCacheSwapLogs))
    }
  }

  async getResourceCached(account: string): Promise<ResourceData> {
    const results: ResourceData = {pools: {}, tokens: [], swapLogs: [], poolGroups: {}}
    if (!this.storage) return results
    const ddlLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.DDL_LOGS) || '[]')
    const swapLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account) || '[]')
    const [ddlLogsParsed, swapLogsParsed] = [this.parseDdlLogs(ddlLogs), this.parseDdlLogs(swapLogs)]

    if (ddlLogsParsed && ddlLogsParsed.length > 0) {
      const {tokens, pools, poolGroups} = await this.generatePoolData(ddlLogsParsed)
      results.tokens = tokens
      results.pools = pools
      results.poolGroups = poolGroups
    }
    if (swapLogsParsed && swapLogsParsed.length > 0) {
      results.swapLogs = swapLogsParsed
    }
    this.pools = {...results.pools, ...this.pools}
    return results
  }

  async getNewResource(account: string): Promise<ResourceData> {
    const etherscanConfig = this.scanApi ? {
      url: this.scanApi,
      maxResults: 1000,
      rangeThreshold: 0,
      rateLimitCount: 1,
      rateLimitDuration: 5000,
      apiKeys: ['']
    } : undefined

    const provider = new AssistedJsonRpcProvider(
      this.providerToGetLog,
      etherscanConfig
    )
    const lastHeadBlockCached = this.getLastBlockCached(account)
    const accTopic = account ? '0x' + '0'.repeat(24) + account.slice(2) : null
    const topics = this.getTopics()

    const filterTopics = [
      [topics.Derivable, null, null, null],
    ]
    if (accTopic) {
      filterTopics.push(
        [null, accTopic, null, null],
        [null, null, accTopic, null],
        [null, null, null, accTopic])
    }

    return await provider.getLogs({
      fromBlock: lastHeadBlockCached || 0,
      toBlock: MAX_BLOCK,
      topics: filterTopics
    }).then((logs: any) => {
      if (!logs?.length) {
        return [[], []]
      }
      const headBlock = logs[logs.length - 1]?.blockNumber
      const topics = this.getTopics()
      const ddlLogs = logs.filter((log: any) => {
        return log.address && [topics.LogicCreated, topics.PoolCreated, topics.Derivable].includes(log.topics[0])
      })
      const swapLogs = logs.filter((log: any) => {
        return log.address && [topics.Transfer, topics.TransferSingle, topics.TransferBatch, topics.Deposit].includes(log.topics[0])
      })
      this.cacheDdlLog({
        ddlLogs,
        swapLogs,
        headBlock,
        account
      })

      return [this.parseDdlLogs(ddlLogs), []]
    }).then(async ([ddlLogs, swapLogs]: any) => {
      const result: ResourceData = {pools: {}, tokens: [], swapLogs: [], poolGroups: {}}
      if (swapLogs && swapLogs.length > 0) {
        result.swapLogs = swapLogs
      }
      if (ddlLogs && ddlLogs.length > 0) {
        const {tokens, pools, poolGroups} = await this.generatePoolData(ddlLogs)
        result.tokens = tokens
        result.pools = pools
        result.poolGroups = poolGroups
      }
      this.pools = {...result.pools, ...this.pools}
      return result
    }).catch((e: any) => {
      console.error(e)
      return {pools: {}, tokens: [], swapLogs: []}
    })
  }

  /**
   * parse DDL logs
   * @param logs
   */
  generatePoolData(logs: ParseLogType[]) {
    const allTokens: string[] = []
    const allUniPools: string[] = []
    const poolData = {}
    const logicData = {}
    logs.forEach((log) => {
      if (log.name === 'LogicCreated') {
        const powers = decodePowers(log.args.powers)
        logicData[log.address] = {
          logic: log.address,
          dTokens: powers.map((value, key) => {
            return {power: value, index: key}
          }),
          baseToken: ethers.utils.getAddress(log.topics[2].slice(0, 42)),
          baseSymbol: ethers.utils.parseBytes32String(log.args.baseSymbol),
          quoteSymbol: ethers.utils.parseBytes32String(log.args.quoteSymbol),
          cToken: ethers.utils.getAddress(log.topics[3].slice(0, 42)),
          priceToleranceRatio: log.args.priceToleranceRatio,
          rentRate: log.args.rentRate,
          deleverageRate: log.args.deleverageRate,
          powers
        }
      }
    })

    logs.forEach((log) => {
      if (log.name === 'PoolCreated') {
        const logic = ethers.utils.getAddress(log.topics[3].slice(0, 42))
        const factory = ethers.utils.getAddress(log.topics[2].slice(0, 42))
        const data = log.args
        const powers = [log.args.k.toNumber(), -log.args.k.toNumber()]
        data.dTokens = powers.map((value, key) => {
          return {power: value, index: key}
        })

        data.dTokens = (data.dTokens as { index: number, power: number }[])
          .map((data) => `${log.address}-${data.index}`)

        poolData[log.address] = {
          ...data,
          poolAddress: log.address,
          logic,
          factory,
          powers,
          cToken: data.TOKEN_R
        }
        // allUniPools.push(data.pairToken)
        allTokens.push(data.TOKEN_R)
      }
    })

    return this.loadStatesData(allTokens, poolData, allUniPools)
  }

  /**
   * load Token detail, poolstate data and then dispatch to Store
   * @param listTokens
   * @param listPools
   * @param uniPools
   */
  //@ts-ignore
  async loadStatesData(listTokens: string[], listPools: { [key: string]: PoolType }, uniPools: string[]) {
    const multicall = new Multicall({
      multicallCustomContractAddress: CONFIGS[this.chainId].multiCall,
      ethersProvider: this.getPoolOverridedProvider(Object.keys(listPools)),
      tryAggregate: true
    })
    const normalTokens = _.uniq(getNormalAddress(listTokens))

    // @ts-ignore
    const context: ContractCallContext[] = this.getMultiCallRequest(normalTokens, listPools)
    const [{results}] = await Promise.all([
      multicall.call(context),
      // this.UNIV2PAIR.getPairsInfo({
      //   pairAddresses: uniPools
      // })
    ])
    const pairsInfo = {}

    // const contract = new ethers.Contract('0xDB837256BB6F490B773f1Fc4A02334300400fD70', PoolOverride.abi, this.getPoolOverridedProvider(Object.keys(listPools)))
    // const a = await contract.getStates('0x800000000000000100000000b8e9111b76b719e5b165cd63a3811c03eb917aff', '0xc28A7e46bE1BB74a63aD32784D785A941D1954ab')
    // console.log(a)

    const {tokens: tokensArr, poolsState} = this.parseMultiCallResponse(results, Object.keys(listPools))
    const tokens = []
    for (let i = 0; i < tokensArr.length; i++) {
      tokens.push({
        symbol: tokensArr[i][0],
        name: tokensArr[i][1],
        decimal: tokensArr[i][2],
        totalSupply: tokensArr[i][3],
        address: normalTokens[i]
      })
    }

    const pools = {...listPools}
    const poolGroups = {}

    for (const i in pools) {
      pools[i].states = poolsState[i]
      const {UTR, TOKEN, MARK: _MARK, ORACLE, TOKEN_R, powers, k: _k} = pools[i]
      const MARK = _MARK.toString()
      const k = _k.toNumber()
      const id = [UTR, TOKEN, MARK, ORACLE, TOKEN_R].join('-')
      if (poolGroups[id]) {
        poolGroups[id].pools[i] = pools[i]
      } else {
        poolGroups[id] = {pools: {[i]: pools[i]}}
      }

      poolGroups[id].states = {
        twapBase: poolsState[i].twap,
        spotBase: poolsState[i].spot
      }
      poolGroups[id].UTR = pools[i].UTR
      poolGroups[id].TOKEN = pools[i].TOKEN
      poolGroups[id].MARK = pools[i].MARK
      poolGroups[id].ORACLE = pools[i].ORACLE
      poolGroups[id].TOKEN_R = pools[i].TOKEN_R
      if (poolGroups[id].powers) {
        poolGroups[id].powers.push(pools[i].powers[0], pools[i].powers[1])
      } else {
        poolGroups[id].powers = [...pools[i].powers]
      }
      if (poolGroups[id].dTokens) {
        poolGroups[id].dTokens.push(pools[i].poolAddress + '-' + POOL_IDS.A, pools[i].poolAddress + '-' + POOL_IDS.B)
      } else {
        poolGroups[id].dTokens = [pools[i].poolAddress + '-' + POOL_IDS.A, pools[i].poolAddress + '-' + POOL_IDS.B]
      }

      // pools[i].basePrice = this.getBasePrice(pairInfo, baseToken)
      // pools[i].cPrice = bn(poolsState[i].twapLP).mul(LP_PRICE_UNIT).shr(112).toNumber() / LP_PRICE_UNIT
      // const rdc = this.getRdc(poolsState[i], pools[i].powers, pools[i].cPrice)
      // const rentRate = this.getRentRate(rdc, pools[i].rentRate)
      // pools[i].states = {
      //   ...poolsState[i],
      //   ...rdc,
      //   ...rentRate
      // }

      const tokenR: any = tokens.find((t) => t.address === pools[i].TOKEN_R)

      tokens.push({
        symbol: tokenR?.symbol + '^' + k,
        name: tokenR?.symbol + '^' + k,
        decimal: 18,
        totalSupply: 0,
        address: pools[i].poolAddress + '-' + POOL_IDS.A
      })
      tokens.push({
        symbol: tokenR?.symbol + '^-' + k,
        name: tokenR?.symbol + '^-' + k,
        decimal: 18,
        totalSupply: 0,
        address: pools[i].poolAddress + '-' + POOL_IDS.B
      })
      tokens.push({
        symbol: tokenR?.symbol + ' CP',
        name: tokenR?.symbol + ' CP',
        decimal: 18,
        totalSupply: 0,
        address: pools[i].poolAddress + '-' + POOL_IDS.C
      })
    }

    return {tokens, pools, poolGroups}
  }

  getRentRate({rDcLong, rDcShort, R}: { R: BigNumber, rDcLong: BigNumber, rDcShort: BigNumber }, rentRate: BigNumber) {
    const diff = bn(rDcLong).sub(rDcShort).abs()
    const rate = R.isZero() ? bn(0) : diff.mul(rentRate).div(R)
    return {
      rentRateLong: rDcLong.add(rDcShort).isZero() ? bn(0) : rate.mul(rDcLong).div(rDcLong.add(rDcShort)),
      rentRateShort: rDcLong.add(rDcShort).isZero() ? bn(0) : rate.mul(rDcShort).div(rDcLong.add(rDcShort))
    }
  }

  getPoolOverridedProvider(poolAddresses: string[]) {
    const stateOverride = {}
    poolAddresses.forEach((address: string) => {
      stateOverride[address] = {
        code: PoolOverride.deployedBytecode
      }
    })

    //@ts-ignore
    this.overrideProvider.setStateOverride({
      ...stateOverride
    })
    return this.overrideProvider
  }

  getBasePrice(pairInfo: any, baseToken: string) {
    const token0 = pairInfo.token0.adr
    const r0 = pairInfo.token0.reserve
    const r1 = pairInfo.token1.reserve
    const [rb, rq] = token0 === baseToken ? [r0, r1] : [r1, r0]
    return weiToNumber(rq.mul(numberToWei(1)).div(rb))
  }

  /**
   * get Multicall Request to get List token and poolState data in 1 request to RPC
   * @param normalTokens
   * @param listPools
   */
  //@ts-ignore
  getMultiCallRequest(normalTokens: string[], listPools: { [key: string]: PoolType }) {
    const request = [
      {
        reference: 'tokens',
        contractAddress: CONFIGS[this.chainId].tokensInfo,
        abi: TokensInfoAbi,
        calls: [{reference: 'tokenInfos', methodName: 'getTokenInfo', methodParameters: [normalTokens]}]
      }
    ]

    for (const i in listPools) {
      request.push({
        // @ts-ignore
        decoded: true,
        reference: 'pools-' + listPools[i].poolAddress,
        contractAddress: listPools[i].poolAddress,
        // @ts-ignore
        abi: PoolOverride.abi,
        calls: [{
          reference: i,
          methodName: 'getStates',
          // @ts-ignore
          methodParameters: [listPools[i].ORACLE, listPools[i].TOKEN]
        }]
      })
    }

    return request
  }


  parseMultiCallResponse(multiCallData: any, poolAddresses: string[]) {
    const pools = {}
    const tokens = multiCallData.tokens.callsReturnContext[0].returnValues
    poolAddresses.forEach((poolAddress) => {
      const abiInterface = new ethers.utils.Interface(PoolOverride.abi)
      const poolStateData = multiCallData['pools-' + poolAddress].callsReturnContext
      const data = formatMultiCallBignumber(poolStateData[0].returnValues)
      const encodeData = abiInterface.encodeFunctionResult('getStates', [data])
      const formatedData = abiInterface.decodeFunctionResult('getStates', encodeData)

      pools[poolStateData[0].reference] = {
        // twapBase: formatedData.states.twap.base._x,
        // twapLP: formatedData.states.twap.LP._x,
        // spotBase: formatedData.states.spot.base._x,
        // spotLP: formatedData.states.spot.LP._x,
        ...formatedData.states
      }
    })

    return {tokens, poolsState: pools}
  }

  getRdc(states: StatesType, powers: number[], cPrice: number): { R: BigNumber, rDcLong: BigNumber, rDcShort: BigNumber } {
    const R = states.twapLP.isZero() ? bn(0) : states.Rc.add(
      states.Rb.mul(states.twapBase).add(states.Rq).div(states.twapLP)
    )
    let rDcLong: BigNumber = bn(0);
    let rDcShort: BigNumber = bn(0);
    const powerState = new PowerState({powers: [...powers]})
    //@ts-ignore
    powerState.loadStates(states)
    const totalSupply = states.totalSupplies
    powers.forEach((power, id) => {
      const dPrice = powerState.getPrice(power)
      const r = dPrice || dPrice === Infinity ? bn(0) : totalSupply[id].mul(numberToWei(dPrice)).div(numberToWei(1))
      if (power >= 0) {
        rDcLong = rDcLong.add(r)
      } else {
        rDcShort = rDcShort.add(r)
      }
    })
    rDcLong = cPrice ? rDcLong.mul(numberToWei(1)).div(numberToWei(cPrice)) : bn(0)
    rDcShort = cPrice ? rDcShort.mul(numberToWei(1)).div(numberToWei(cPrice)) : bn(0)

    return {R, rDcLong: rDcLong, rDcShort: rDcShort}
  }

  parseDdlLogs(ddlLogs: any) {
    const eventInterface = new ethers.utils.Interface(EventsAbi)

    return ddlLogs.map((log: any) => {
      try {
        const decodeLog = eventInterface.parseLog(log)
        let appName = null
        try {
          appName = ethers.utils.parseBytes32String(decodeLog.args.topic1)
        } catch (e) {
        }

        let data: any = decodeLog
        if (appName) {
          data = ethers.utils.defaultAbiCoder.decode(
            EventDataAbis[appName],
            decodeLog.args.data
          )
        }
        const lastHeadBlockCached = this.getLastBlockCached(this.account || '')

        return {
          address: log.address,
          timeStamp: new Date().getTime() - (lastHeadBlockCached - log.blockNumber) * 3000,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          index: log.logIndex,
          logIndex: log.transactionHash + '-' + log.logIndex,
          name: appName,
          topics: log.topics,
          args: {
            ...data
          }
        }
      } catch (e) {
        console.error(e)
        return {}
      }
    })
  }

  getTopics(): { [key: string]: string } {
    const eventInterface = new ethers.utils.Interface(EventsAbi)
    const events = eventInterface.events
    const topics: { [key: string]: string } = {}
    for (const i in events) {
      topics[events[i].name] = ethers.utils.id(i)
    }
    return topics
  }
}

