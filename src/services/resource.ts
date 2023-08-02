import {BigNumber, ethers} from 'ethers'
import {
  ddlGenesisBlock,
  EventDataAbis,
  LOCALSTORAGE_KEY,
  POOL_IDS,
} from '../utils/constant'
import EventsAbi from '../abi/Events.json'
import {Multicall} from 'ethereum-multicall'
import TokensInfoAbi from '../abi/TokensInfo.json'
import {
  LogType,
  ParseLogType,
  PoolGroupsType,
  PoolsType,
  PoolType,
  Storage,
  TokenType,
} from '../types'
import {
  bn,
  decodePowers,
  div,
  formatMultiCallBignumber,
  getNormalAddress, getTopics, parseSqrtSpotPrice,
} from '../utils/helper'
import {UniV2Pair} from './uniV2Pair'
import {JsonRpcProvider} from '@ethersproject/providers'
import PoolOverride from '../abi/PoolOverride.json'
import _ from 'lodash'
import {UniV3Pair} from './uniV3Pair'
import {ConfigType} from './setConfig'
import {DerivableContractAddress} from '../utils/configs'
import {defaultAbiCoder} from "ethers/lib/utils";

const {AssistedJsonRpcProvider} = require('assisted-json-rpc-provider')
const MAX_BLOCK = 4294967295
const TOPIC_APP = ethers.utils.formatBytes32String('DDL')

type ResourceData = {
  pools: PoolsType
  tokens: TokenType[]
  swapLogs: LogType[]
  poolGroups: any
}

export class Resource {
  poolGroups: PoolGroupsType = {}
  pools: PoolsType = {}
  tokens: TokenType[] = []
  swapLogs: LogType[] = []
  unit: number = 1000000
  chainId: number
  scanApi?: any
  scanApiKey?: string
  account?: string
  storage?: Storage
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  UNIV2PAIR: UniV2Pair
  UNIV3PAIR: UniV3Pair
  addresses: Partial<DerivableContractAddress>

  constructor(config: ConfigType) {
    this.unit = config.unit ?? this.unit
    this.chainId = config.chainId
    this.scanApi = config.scanApi
    this.scanApiKey = config.scanApiKey
    this.account = config.account
    this.storage = config.storage
    this.account = config.account
    this.providerToGetLog = config.providerToGetLog
    this.provider = config.provider
    this.UNIV2PAIR = new UniV2Pair(config)
    this.UNIV3PAIR = new UniV3Pair(config)
    this.overrideProvider = config.overrideProvider
    this.addresses = config.addresses
  }

  async fetchResourceData(account: string) {
    let result: any = {}
    if (!this.chainId) return result
    const [resultCached, newResource] = await Promise.all([
      this.getResourceCached(account),
      this.getNewResource(account),
    ])
    this.poolGroups = {...resultCached.poolGroups, ...newResource.poolGroups}
    this.pools = {...resultCached.pools, ...newResource.pools}
    this.tokens = [...resultCached.tokens, ...newResource.tokens]
    this.swapLogs = [...resultCached.swapLogs, ...newResource.swapLogs]
  }

  getLastBlockCached(account: string) {
    if (!this.storage || !this.storage.getItem)
      return ddlGenesisBlock[this.chainId]
    const lastDDlBlock =
      Number(
        this.storage.getItem(
          this.chainId + '-' + LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS,
        ),
      ) || ddlGenesisBlock[this.chainId] - 1
    let lastWalletBlock = ddlGenesisBlock[this.chainId] - 1
    const walletBlockCached = this.storage.getItem(
      this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account,
    )
    if (account && walletBlockCached) {
      lastWalletBlock = Number(walletBlockCached)
    }
    return Math.min(lastDDlBlock + 1, lastWalletBlock + 1)
  }

  cacheDdlLog({
                swapLogs,
                ddlLogs,
                headBlock,
                account,
              }: {
    swapLogs: any
    ddlLogs: any
    headBlock: number
    account: string
  }) {
    if (!this.storage || !this.storage.getItem || !this.storage.setItem) return
    const cachedDdlLogs = JSON.parse(
      this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.DDL_LOGS) ||
      '[]',
    )
    const newCachedDdlLogs = [...ddlLogs, ...cachedDdlLogs].filter(
      (log, index, self) => {
        return (
          index ===
          self.findIndex(
            (t) =>
              t.logIndex === log.logIndex &&
              t.transactionHash === log.transactionHash,
          )
        )
      },
    )
    this.storage.setItem(
      this.chainId + '-' + LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS,
      headBlock.toString(),
    )
    this.storage.setItem(
      this.chainId + '-' + LOCALSTORAGE_KEY.DDL_LOGS,
      JSON.stringify(newCachedDdlLogs),
    )
    if (account) {
      const cachedSwapLogs = JSON.parse(
        this.storage.getItem(
          this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account,
        ) || '[]',
      )
      const newCacheSwapLogs = [...swapLogs, ...cachedSwapLogs].filter(
        (log, index, self) => {
          return (
            index ===
            self.findIndex(
              (t) =>
                t.logIndex === log.logIndex &&
                t.transactionHash === log.transactionHash,
            )
          )
        },
      )

      this.storage.setItem(
        this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account,
        headBlock.toString(),
      )
      this.storage.setItem(
        this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account,
        JSON.stringify(newCacheSwapLogs),
      )
    }
  }

  async getResourceCached(account: string): Promise<ResourceData> {
    const results: ResourceData = {
      pools: {},
      tokens: [],
      swapLogs: [],
      poolGroups: {},
    }
    if (!this.storage || !this.storage.getItem) return results
    const ddlLogs = JSON.parse(
      this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.DDL_LOGS) ||
      '[]',
    )
    const swapLogs = JSON.parse(
      this.storage.getItem(
        this.chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account,
      ) || '[]',
    )
    const [ddlLogsParsed, swapLogsParsed] = [
      this.parseDdlLogs(ddlLogs),
      this.parseDdlLogs(swapLogs),
    ]

    if (ddlLogsParsed && ddlLogsParsed.length > 0) {
      const {tokens, pools, poolGroups} = await this.generatePoolData(
        ddlLogsParsed,
      )
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
    // TODO: move this part to constructor
    const etherscanConfig = typeof this.scanApi === 'string' ? {
        url: this.scanApi,
        maxResults: 1000,
        rangeThreshold: 0,
        rateLimitCount: 1,
        rateLimitDuration: 5000,
        apiKeys: this.scanApiKey ? [this.scanApiKey] : []
    } : this.scanApi

    const provider = new AssistedJsonRpcProvider(
      this.providerToGetLog,
      etherscanConfig,
    )
    const lastHeadBlockCached = this.getLastBlockCached(account)
    const accTopic = account ? '0x' + '0'.repeat(24) + account.slice(2) : null
    const topics = getTopics()

    let filterTopics: any = [topics.Derivable[0], null, null, null]
    if (accTopic) {
      filterTopics = [
        [topics.Derivable[0], null, null, null],
        [null, accTopic, null, null],
        [null, null, accTopic, null],
        [null, null, null, accTopic],
      ]
    }

    return await provider
      .getLogs({
        fromBlock: lastHeadBlockCached || 0,
        toBlock: MAX_BLOCK,
        topics: filterTopics,
      })
      .then((logs: any) => {
        if (!logs?.length) {
          return [[], []]
        }
        const headBlock = logs[logs.length - 1]?.blockNumber
        const ddlLogs = logs.filter((log: any) => {
          return log.address
            && topics.Derivable.includes(log.topics[0])
            && log.address === this.addresses.poolFactory
        })
        const swapLogs = logs.filter((log: any) => {
          return log.address && topics.Swap.includes(log.topics[0])
        })
        this.cacheDdlLog({
          ddlLogs,
          swapLogs,
          headBlock,
          account,
        })
        return [
          this.parseDdlLogs(ddlLogs),
          this.parseDdlLogs(swapLogs)
        ]
      })
      .then(async ([ddlLogs, swapLogs]: any) => {
        const result: ResourceData = {
          pools: {},
          tokens: [],
          swapLogs: [],
          poolGroups: {},
        }
        if (swapLogs && swapLogs.length > 0) {
          result.swapLogs = swapLogs
        }
        if (ddlLogs && ddlLogs.length > 0) {
          const {tokens, pools, poolGroups} = await this.generatePoolData(
            ddlLogs,
          )
          result.tokens = tokens
          result.pools = pools
          result.poolGroups = poolGroups
        }
        this.pools = {...result.pools, ...this.pools}
        return result
      })
      .catch((e: any) => {
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
          powers,
        }
      }
    })

    logs.forEach((log) => {
      if (log.name === 'PoolCreated') {
        const data = log.args
        const powers = [log.args.k.toNumber(), -log.args.k.toNumber()]
        data.dTokens = powers.map((value, key) => {
          return {power: value, index: key}
        })

        data.dTokens = (data.dTokens as { index: number; power: number }[]).map(
          (data) => `${log.address}-${data.index}`,
        )

        poolData[log.address] = {
          ...data,
          poolAddress: log.address,
          powers,
          cToken: data.TOKEN_R,
        }
        const pair = ethers.utils.getAddress('0x' + data.ORACLE.slice(-40))

        allUniPools.push(pair)
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
  async loadStatesData(
    listTokens: string[],
    listPools: { [key: string]: PoolType },
    //@ts-ignore
    uniPools: string[],
  ): Promise<{
    tokens: TokenType[]
    pools: any
    poolGroups: any
  }> {
    const multicall = new Multicall({
      multicallCustomContractAddress: this.addresses.multiCall,
      ethersProvider: this.getPoolOverridedProvider(),
      tryAggregate: true,
    })
    const normalTokens = _.uniq(getNormalAddress(listTokens))

    // @ts-ignore
    const context: ContractCallContext[] = this.getMultiCallRequest(
      normalTokens,
      listPools,
    )
    const [{results}, pairsInfo] = await Promise.all([
      multicall.call(context),
      this.UNIV3PAIR.getPairsInfo({
        pairAddresses: _.uniq(uniPools),
      }),
    ])

    const {tokens: tokensArr, poolsState} = this.parseMultiCallResponse(
      results,
      Object.keys(listPools),
    )
    const tokens: any[] = []
    for (let i = 0; i < tokensArr.length; i++) {
      tokens.push({
        symbol: tokensArr[i][0],
        name: tokensArr[i][1],
        decimal: tokensArr[i][2],
        totalSupply: tokensArr[i][3],
        address: normalTokens[i],
      })
    }

    const pools = {...listPools}
    const poolGroups = {}

    for (const i in pools) {
      if(!poolsState[i])  {
        delete pools[i]
        continue
      }
      pools[i].states = poolsState[i]
      pools[i] = {
        ...pools[i],
        ...this.calcPoolInfo(pools[i]),
      }

      const {MARK: _MARK, ORACLE, k: _k} = pools[i]

      const quoteTokenIndex = bn(ORACLE.slice(0, 3)).gt(0) ? 1 : 0
      const pair = ethers.utils.getAddress('0x' + ORACLE.slice(-40))

      const baseToken =
        quoteTokenIndex === 0 ? pairsInfo[pair].token1 : pairsInfo[pair].token0
      const quoteToken =
        quoteTokenIndex === 0 ? pairsInfo[pair].token0 : pairsInfo[pair].token1

      const tokenR = tokens.find((t) => t.address === pools[i].TOKEN_R)

      pools[i].baseToken = baseToken.address
      pools[i].quoteToken = quoteToken.address

      const k = _k.toNumber()
      const id = [pair].join('-')
      if (poolGroups[id]) {
        poolGroups[id].pools[i] = pools[i]
      } else {
        poolGroups[id] = {pools: {[i]: pools[i]}}
        poolGroups[id].UTR = pools[i].UTR
        poolGroups[id].pair = pairsInfo[pair]
        poolGroups[id].quoteTokenIndex = quoteTokenIndex
        poolGroups[id].baseToken = pools[i].baseToken
        poolGroups[id].quoteToken = pools[i].quoteToken
        poolGroups[id].TOKEN = pools[i].TOKEN
        poolGroups[id].MARK = pools[i].MARK
        poolGroups[id].INIT_TIME = pools[i].INIT_TIME
        poolGroups[id].HALF_LIFE = pools[i].HALF_LIFE
        poolGroups[id].ORACLE = pools[i].ORACLE
        poolGroups[id].TOKEN_R = pools[i].TOKEN_R
        poolGroups[id].states = {
          twapBase: poolsState[i].twap,
          spotBase: poolsState[i].spot,
          ...poolsState[i],
        }
        poolGroups[id].basePrice = parseSqrtSpotPrice(
          poolsState[i].spot,
          pairsInfo[pair].token0,
          pairsInfo[pair].token1,
          quoteTokenIndex,
        )
      }

      const rdc = this.getRdc(Object.values(poolGroups[id].pools))
      poolGroups[id].states = {
        ...poolGroups[id].states,
        ...rdc,
      }

      if (poolGroups[id].powers) {
        poolGroups[id].k.push(pools[i].k.toNumber())
        poolGroups[id].powers.push(pools[i].powers[0], pools[i].powers[1])
      } else {
        poolGroups[id].k = [pools[i].k.toNumber()]
        poolGroups[id].powers = [...pools[i].powers]
      }
      if (poolGroups[id].dTokens) {
        poolGroups[id].dTokens.push(
          pools[i].poolAddress + '-' + POOL_IDS.A,
          pools[i].poolAddress + '-' + POOL_IDS.B,
        )
      } else {
        poolGroups[id].dTokens = [
          pools[i].poolAddress + '-' + POOL_IDS.A,
          pools[i].poolAddress + '-' + POOL_IDS.B,
        ]
      }
      if (poolGroups[id].allTokens) {
        poolGroups[id].allTokens.push(
          pools[i].poolAddress + '-' + POOL_IDS.A,
          pools[i].poolAddress + '-' + POOL_IDS.B,
          pools[i].poolAddress + '-' + POOL_IDS.C,
        )
      } else {
        poolGroups[id].allTokens = [
          pools[i].poolAddress + '-' + POOL_IDS.A,
          pools[i].poolAddress + '-' + POOL_IDS.B,
          pools[i].poolAddress + '-' + POOL_IDS.C,
        ]
      }

      tokens.push(
        {
          symbol: baseToken.symbol + '^' + (1 + k / 2),
          name: baseToken.symbol + '^' + (1 + k / 2),
          decimal: tokenR.decimal,
          totalSupply: 0,
          address: pools[i].poolAddress + '-' + POOL_IDS.A,
        },
        {
          symbol: baseToken.symbol + '^' + (1 - k / 2),
          name: baseToken.symbol + '^' + (1 - k / 2),
          decimal: tokenR.decimal,
          totalSupply: 0,
          address: pools[i].poolAddress + '-' + POOL_IDS.B,
        },
        {
          symbol: `DLP-${baseToken.symbol}-${k / 2}`,
          name: `DLP-${baseToken.symbol}-${k / 2}`,
          decimal: tokenR.decimal,
          totalSupply: 0,
          address: pools[i].poolAddress + '-' + POOL_IDS.C,
        },
        baseToken,
        quoteToken,
      )
    }

    return {
      // @ts-ignore
      tokens: _.uniqBy(tokens, 'address'),
      pools,
      poolGroups,
    }
  }

  getRentRate(
    {
      rDcLong,
      rDcShort,
      R,
    }: { R: BigNumber; rDcLong: BigNumber; rDcShort: BigNumber },
    rentRate: BigNumber,
  ) {
    const diff = bn(rDcLong).sub(rDcShort).abs()
    const rate = R.isZero() ? bn(0) : diff.mul(rentRate).div(R)
    return {
      rentRateLong: rDcLong.add(rDcShort).isZero()
        ? bn(0)
        : rate.mul(rDcLong).div(rDcLong.add(rDcShort)),
      rentRateShort: rDcLong.add(rDcShort).isZero()
        ? bn(0)
        : rate.mul(rDcShort).div(rDcLong.add(rDcShort)),
    }
  }

  getPoolOverridedProvider() {
    const stateOverride = {}
    // poolAddresses.forEach((address: string) => {
      stateOverride[this.addresses.logic as string] = {
        code: PoolOverride.deployedBytecode,
      }
    // })

    //@ts-ignore
    this.overrideProvider.setStateOverride({
      ...stateOverride,
    })
    return this.overrideProvider
  }

  /**
   * get Multicall Request to get List token and poolState data in 1 request to RPC
   * @param normalTokens
   * @param listPools
   */
  //@ts-ignore
  getMultiCallRequest(
    // @ts-ignore
    normalTokens: string[],
    // @ts-ignore
    listPools: { [key: string]: PoolType },
  ) {
    const request: any = [
      {
        reference: 'tokens',
        contractAddress: this.addresses.tokensInfo,
        abi: TokensInfoAbi,
        calls: [
          {
            reference: 'tokenInfos',
            methodName: 'getTokenInfo',
            methodParameters: [normalTokens],
          },
        ],
      },
    ]

    for (const i in listPools) {
      request.push({
        // @ts-ignore
        decoded: true,
        reference: 'pools-' + listPools[i].poolAddress,
        contractAddress: listPools[i].poolAddress,
        // @ts-ignore
        abi: PoolOverride.abi,
        calls: [
          {
            reference: i,
            methodName: 'compute',
            methodParameters: [
              this.addresses.token,
            ],
          },
        ],
      })
    }

    return request
  }

  parseMultiCallResponse(multiCallData: any, poolAddresses: string[]) {
    const pools = {}
    const tokens = multiCallData.tokens.callsReturnContext[0].returnValues
    poolAddresses.forEach((poolAddress) => {
      try {
        const abiInterface = new ethers.utils.Interface(PoolOverride.abi)
        const poolStateData =
          multiCallData['pools-' + poolAddress].callsReturnContext
        const data = formatMultiCallBignumber(poolStateData[0].returnValues)
        const encodeData = abiInterface.encodeFunctionResult('compute', [data])
        const formatedData = abiInterface.decodeFunctionResult(
          'compute',
          encodeData,
        )
        pools[poolStateData[0].reference] = {
          // twapBase: formatedData.states.twap.base._x,
          // twapLP: formatedData.states.twap.LP._x,
          // spotBase: formatedData.states.spot.base._x,
          // spotLP: formatedData.states.spot.LP._x,
          ...formatedData.stateView,
          ...formatedData.stateView.state,
        }
      } catch (e) {
        console.error("Cannot get states of: ", poolAddress)
        console.error(e)
      }
    })

    return {tokens, poolsState: pools}
  }

  calcPoolInfo(pool: PoolType) {
    const {R, rA, rB, rC} = pool.states
    const SECONDS_PER_DAY = 86400
    const riskFactor = rC.gt(0) ? div(rA.sub(rB), rC) : '0'
    const deleverageRiskA = R.isZero() ? 0 : rA.mul(2*this.unit).div(R).toNumber() / this.unit
    const deleverageRiskB = R.isZero() ? 0 : rB.mul(2*this.unit).div(R).toNumber() / this.unit
    const dailyInterestRate =
      1 - Math.pow(2, -SECONDS_PER_DAY / pool.INTEREST_HL.toNumber())
    return {
      riskFactor,
      deleverageRiskA,
      deleverageRiskB,
      dailyInterestRate,
    }
  }

  getRdc(pools: any): {
    supplyDetails: any
    rDetails: any
    R: BigNumber
    rC: BigNumber
    rDcLong: BigNumber
    rDcShort: BigNumber
  } {
    let rC = bn(0)
    let rDcLong = bn(0)
    let rDcShort = bn(0)
    let supplyDetails = {}
    let rDetails = {}
    for (let pool of pools) {
      rC = pool.states.rC
      rDcLong = pool.states.rA
      rDcShort = pool.states.rB
      rDetails[pool.k.toNumber()] = pool.states.rA
      rDetails[-pool.k.toNumber()] = pool.states.rB

      supplyDetails[pool.k.toNumber()] = pool.states.sA
      supplyDetails[-pool.k.toNumber()] = pool.states.sB
    }
    return {
      supplyDetails,
      rDetails,
      R: rC.add(rDcLong).add(rDcShort),
      rC,
      rDcLong,
      rDcShort,
    }
  }

  parseDdlLogs(ddlLogs: any) {
    const eventInterface = new ethers.utils.Interface(EventsAbi)
    const topics = getTopics()
    return ddlLogs.map((log: any) => {
      if(!topics.Derivable.includes(log.topics[0]) && !topics.Swap.includes(log.topics[0])) {
        return {}
      }
      try {
        const decodeLog = eventInterface.parseLog(log)
        let appName = ''
        try {
          appName = ethers.utils.parseBytes32String(decodeLog.args.topic1)
        } catch (e) {
        }

        let data: any = decodeLog
        if (appName === 'PoolCreated') {
          const poolCreatedData = defaultAbiCoder.decode(EventDataAbis[appName], decodeLog.args.data)
          data = {
            ...poolCreatedData,
            TOKEN_R: ethers.utils.getAddress('0x' + decodeLog.args.topic3.slice(-40))
          }
        }

        return {
          address: data.poolAddress,
          timeStamp: parseInt(log.timeStamp),
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          index: log.logIndex,
          logIndex: log.transactionHash + '-' + log.logIndex,
          name: appName,
          topics: log.topics,
          args: {
            ...data,
          },
        }
      } catch (e) {
        console.error(e)
        return {}
      }
    })
  }
}
