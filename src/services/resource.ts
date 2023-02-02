import {ethers}                                                                    from "ethers";
import {ddlGenesisBlock, EventDataAbis, LOCALSTORAGE_KEY, LP_PRICE_UNIT, POOL_IDS} from "../utils/constant";
import EventsAbi                                                                   from '../abi/Events.json'
import {Multicall}                                                                 from "ethereum-multicall";
import {CONFIGS}                                                                   from "../utils/configs";
import TokensInfoAbi                                                               from "../abi/TokensInfo.json";
import {ParseLogType, PoolsType, PoolType, Storage, SwapLog, TokenType}            from "../types";
import {
  bn, decodePowers,
  formatMultiCallBignumber,
  getLogicAbi,
  getNormalAddress,
  numberToWei,
  weiToNumber
}                                                                                  from "../utils/helper";
import {UniV2Pair}                                                                 from "./uniV2Pair";

const { AssistedJsonRpcProvider } = require('assisted-json-rpc-provider')
const MAX_BLOCK = 4294967295
const TOPIC_APP = ethers.utils.formatBytes32String('DDL')

type ConfigType = {
  chainId: number
  scanApi: string
  account?: string
  storage?: Storage
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  UNIV2PAIR: UniV2Pair
}

type ResourceData = {
  pools: PoolsType
  tokens: TokenType[]
  swapLogs: SwapLog[]
}

export class Resource {
  pools: PoolsType = {}
  tokens: TokenType[] = []
  swapLogs: SwapLog[] = []
  chainId: number
  scanApi: string
  account?: string
  storage?: Storage
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
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
  }

  async fetchResourceData(account: string) {
    let result: any = {}
    if (!this.chainId) return result;
    const [resultCached, newResource] = await Promise.all([
      this.getResourceCached(account),
      this.getNewResource(account)
    ])
    this.pools = { ...resultCached.pools, ...newResource.pools }
    this.tokens = [...resultCached.tokens, ...newResource.tokens]
    this.swapLogs = [...resultCached.swapLogs, ...newResource.swapLogs]
  }

  getLastBlockCached(account: string) {
    if (!this.storage) return ddlGenesisBlock[this.chainId]
    const lastDDlBlock = Number(this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS)) || ddlGenesisBlock[this.chainId] - 1
    const lastWalletBlock = Number(this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account)) || ddlGenesisBlock[this.chainId] - 1
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
        t.logIndex === log.logIndex
      ))
    })
    this.storage.setItem(this.chainId + '-' + LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS, headBlock.toString())
    this.storage.setItem(this.chainId + '-' + LOCALSTORAGE_KEY.DDL_LOGS, JSON.stringify(newCachedDdlLogs))
    if (account) {
      const cachedSwapLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account) || '[]')
      const newCacheSwapLogs = [...swapLogs, ...cachedSwapLogs].filter((log, index, self) => {
        return index === self.findIndex((t) => (
          t.logIndex === log.logIndex
        ))
      })

      this.storage.setItem(this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account, headBlock.toString())
      this.storage.setItem(this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account, JSON.stringify(newCacheSwapLogs))
    }
  }

  async getResourceCached(account: string): Promise<ResourceData> {
    const results: ResourceData = { pools: {}, tokens: [], swapLogs: [] }
    if (!this.storage) return results
    const ddlLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.DDL_LOGS) || '[]')
    const swapLogs = JSON.parse(this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account) || '[]')
    const [ddlLogsParsed, swapLogsParsed] = [this.parseDdlLogs(ddlLogs), this.parseDdlLogs(swapLogs)]

    if (ddlLogsParsed && ddlLogsParsed.length > 0) {
      const { tokens, pools } = await this.generatePoolData(ddlLogsParsed)
      results.tokens = tokens
      results.pools = pools
    }
    if (swapLogsParsed && swapLogsParsed.length > 0) {
      results.swapLogs = swapLogsParsed
    }
    this.pools = { ...results.pools, ...this.pools }
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

    return await provider.getLogs({
      fromBlock: lastHeadBlockCached,
      toBlock: MAX_BLOCK,
      // topics: [
      //     null,
      //     [topics.DDL, null, null],
      //     [null, accTopic, null],
      //     [null, null, accTopic]
      // ]
      topics: [
        [topics.DDL, null, null, null],
        [null, null, null, null],
        [null, null, accTopic, null],
        [null, null, null, accTopic],
      ]
    }).then((logs: any) => {
      if (!logs?.length) {
        return [[], []]
      }
      const headBlock = logs[logs.length - 1]?.blockNumber
      const topics = this.getTopics()
      const ddlLogs = logs.filter((log: any) => {
        return log.address && [topics.LogicCreated, topics.PoolCreated, topics.DDL].includes(log.topics[0])
      })
      const swapLogs = logs.filter((log: any) => {
        return log.address && [topics.TransferSingle, topics.TransferBatch].includes(log.topics[0])
      })
      this.cacheDdlLog({
        ddlLogs,
        swapLogs,
        headBlock,
        account
      })

      console.log(ddlLogs.length)
      return [this.parseDdlLogs(ddlLogs), this.parseDdlLogs(swapLogs)]
    }).then(async ([ddlLogs, swapLogs]: any) => {
      const result: ResourceData = { pools: {}, tokens: [], swapLogs: [] }
      if (swapLogs && swapLogs.length > 0) {
        result.swapLogs = swapLogs
      }
      if (ddlLogs && ddlLogs.length > 0) {
        const { tokens, pools } = await this.generatePoolData(ddlLogs)
        result.tokens = tokens
        result.pools = pools
      }
      this.pools = { ...result.pools, ...this.pools }
      return result
    }).catch((e: any) => {
      console.error(e)
      return { pools: {}, tokens: [], swapLogs: [] }
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
            return { power: value, index: key }
          }),
          baseToken: log.topics[2].slice(0, 42),
          baseSymbol: ethers.utils.parseBytes32String(log.args.baseSymbol),
          quoteSymbol: ethers.utils.parseBytes32String(log.args.quoteSymbol),
          cToken: log.topics[3].slice(0, 42),
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
        const data = logicData[logic]

        data.dTokens = (data.dTokens as { index: number, power: number }[])
          .map((data) => `${log.address}-${data.index}`)

        poolData[log.address] = {
          poolAddress: log.address,
          ...data
        }
        allUniPools.push(data.cToken)
        allTokens.push(...data.dTokens, data.cToken, data.baseToken)
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
  async loadStatesData(listTokens: string[], listPools: { [key: string]: PoolType }, uniPools: string[]) {
    const multicall = new Multicall({
      multicallCustomContractAddress: CONFIGS[this.chainId].multiCall,
      ethersProvider: this.provider,
      tryAggregate: true
    })
    const normalTokens = getNormalAddress(listTokens)

    // @ts-ignore
    const context: ContractCallContext[] = this.getMultiCallRequest(normalTokens, listPools)
    const [{ results }, pairsInfo] = await Promise.all([
      multicall.call(context),
      this.UNIV2PAIR.getPairsInfo({
        pairAddresses: uniPools
      })
    ])

    const { tokens: tokensArr, poolsState } = this.parseMultiCallResponse(results)
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

    const pools = { ...listPools }
    for (const i in pools) {
      const { baseToken, powers } = pools[i]
      const pairInfo = pairsInfo[pools[i].cToken]
      const quoteToken = pairInfo.token0.adr === baseToken ? pairInfo.token1.adr : pairInfo.token0.adr
      const [baseId, quoteId] = pairInfo.token0.adr === baseToken
        ? [POOL_IDS.token0, POOL_IDS.token1]
        : [POOL_IDS.token1, POOL_IDS.token0]

      pools[i].states = poolsState[i]
      pools[i].quoteToken = quoteToken
      pools[i].baseId = baseId
      pools[i].quoteId = quoteId
      pools[i].basePrice = this.getBasePrice(pairInfo, baseToken)
      pools[i].cPrice = bn(pools[i].states.twapLP).mul(LP_PRICE_UNIT).shr(112).toNumber() / LP_PRICE_UNIT

      powers.forEach((power: number, key: number) => {
        tokens.push({
          symbol: pools[i].baseSymbol + '^' + power,
          name: pools[i].baseSymbol + '^' + power,
          decimal: 18,
          totalSupply: 0,
          address: i + '-' + key
        })
      })
      tokens.push(
        {
          symbol: 'DDL-CP',
          name: 'DDL-CP',
          decimal: 18,
          totalSupply: 0,
          address: i + '-' + POOL_IDS.cp
        },
        {
          address: pairInfo.token0.adr,
          decimal: pairInfo.token0.decimals?.toNumber(),
          name: pairInfo.token0.name,
          symbol: pairInfo.token0.symbol,
          totalSupply: pairInfo.token0.totalSupply
        },
        {
          address: pairInfo.token1.adr,
          decimal: pairInfo.token1.decimals?.toNumber(),
          name: pairInfo.token1.name,
          symbol: pairInfo.token1.symbol,
          totalSupply: pairInfo.token1.totalSupply
        }
      )
    }

    return { tokens, pools }
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
  getMultiCallRequest(normalTokens: string[], listPools: { [key: string]: PoolType }) {
    const request = [
      {
        reference: 'tokens',
        contractAddress: CONFIGS[this.chainId].tokensInfo,
        abi: TokensInfoAbi,
        calls: [{ reference: 'tokenInfos', methodName: 'getTokenInfo', methodParameters: [normalTokens] }]
      }
    ]

    for (const i in listPools) {
      request.push({
        // @ts-ignore
        decoded: true,
        reference: 'pools',
        contractAddress: listPools[i].logic,
        // @ts-ignore
        abi: getLogicAbi(this.chainId),
        calls: [{ reference: i, methodName: 'getStates', methodParameters: [] }]
      })
    }

    return request
  }


  parseMultiCallResponse(data: any) {
    const abiInterface = new ethers.utils.Interface(getLogicAbi(this.chainId))
    const poolStateData = data.pools.callsReturnContext
    const tokens = data.tokens.callsReturnContext[0].returnValues
    const pools = {}
    for (let i = 0; i < poolStateData.length; i++) {
      const data = formatMultiCallBignumber(poolStateData[i].returnValues)
      const encodeData = abiInterface.encodeFunctionResult('getStates', [data])
      const formatedData = abiInterface.decodeFunctionResult('getStates', encodeData)

      pools[poolStateData[i].reference] = {
        twapBase: formatedData.states.twap.base._x,
        twapLP: formatedData.states.twap.LP._x,
        spotBase: formatedData.states.spot.base._x,
        spotLP: formatedData.states.spot.LP._x,
        ...formatedData.states
      }
    }

    return { tokens, poolsState: pools }
  }

  parseDdlLogs(ddlLogs: any) {
    const eventInterface = new ethers.utils.Interface(EventsAbi)

    return ddlLogs.map((log: any) => {
      try {
        const decodeLog = eventInterface.parseLog(log)
        let appName = null
        try {
          appName = ethers.utils.parseBytes32String(decodeLog.args.topic1)
        } catch(e) {}

        let data: any = decodeLog
        if (appName) {
          data = ethers.utils.defaultAbiCoder.decode(
            EventDataAbis[appName],
            decodeLog.args.data
          )
        }

        return {
          address: log.address,
          timeStamp: Number(log.timeStamp),
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

