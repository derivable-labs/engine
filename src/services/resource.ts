import {BigNumber, Contract, ethers} from 'ethers'
import {LOCALSTORAGE_KEY, POOL_IDS, ZERO_ADDRESS} from '../utils/constant'
import {Multicall} from 'ethereum-multicall'
import {LogType, ParseLogType, PoolGroupsType, PoolsType, PoolType, Storage, TokenType} from '../types'
import {
  bn,
  div,
  formatMultiCallBignumber,
  getNormalAddress,
  getTopics,
  kx,
  rateFromHL,
  parsePrice
} from '../utils/helper'
import {JsonRpcProvider} from '@ethersproject/providers'
import _, {uniq, uniqBy} from 'lodash'
import {IPairInfo, IPairsInfo, UniV3Pair} from './uniV3Pair'
import {IDerivableContractAddress, IEngineConfig} from '../utils/configs'
import {defaultAbiCoder} from 'ethers/lib/utils'
import {Profile} from '../profile'
import * as OracleSdk from '../utils/OracleSdk'
import * as OracleSdkAdapter from '../utils/OracleSdkAdapter'
import {unpackId} from '../utils/number'

const {AssistedJsonRpcProvider} = require('assisted-json-rpc-provider')
const MAX_BLOCK = 4294967295
export const Q128 = bn(1).shl(128)
export const M256 = bn(1).shl(256).sub(1)

const {A, B, C} = POOL_IDS

function numDiv(b: BigNumber, unit: number = 1): number {
  try {
    return b.toNumber() / unit
  } catch (err) {
    if (err.reason == 'overflow') {
      return Infinity
    }
    throw err
  }
}

type ResourceData = {
  pools: PoolsType
  tokens: TokenType[]
  swapLogs: LogType[]
  transferLogs: LogType[]
  poolGroups: any
}

type IPriceInfo = {
  [pool: string]: {
    twap: BigNumber
    spot: BigNumber
  }
}

export class Resource {
  poolGroups: PoolGroupsType = {}
  pools: PoolsType = {}
  tokens: TokenType[] = []
  swapLogs: LogType[] = []
  transferLogs: LogType[] = []
  unit: number = 1000000
  chainId: number
  scanApi?: any
  scanApiKey?: string
  account?: string
  storage?: Storage
  provider: ethers.providers.Provider
  providerToGetLog: ethers.providers.Provider
  overrideProvider: JsonRpcProvider
  UNIV3PAIR: UniV3Pair
  derivableAddress: IDerivableContractAddress
  profile: Profile
  stableCoins: string[]

  constructor(engineConfigs: IEngineConfig, profile: Profile) {
    this.chainId = engineConfigs.chainId
    this.scanApi = profile.configs.scanApi
    this.scanApiKey = engineConfigs.scanApiKey
    this.account = engineConfigs.account
    this.storage = engineConfigs.storage
    this.account = engineConfigs.account
    this.providerToGetLog = new ethers.providers.JsonRpcProvider(profile.configs.rpcGetLog || profile.configs.rpc)
    this.provider = new ethers.providers.JsonRpcProvider(profile.configs.rpc)
    this.UNIV3PAIR = new UniV3Pair(engineConfigs, profile)
    this.overrideProvider = new JsonRpcProvider(profile.configs.rpc)
    this.derivableAddress = profile.configs.derivable
    this.profile = profile
    this.stableCoins = profile.configs.stablecoins
  }

  async fetchResourceData(account: string, playMode?: boolean) {
    let result: any = {}
    if (!this.chainId) return result
    await Promise.all([
      this.getResourceCached(account, playMode),
      this.getNewResource(account, playMode),
      this.getWhiteListResource(playMode),
    ])
    // this.poolGroups = {...resultCached.poolGroups, ...newResource.poolGroups}
    // this.pools = {...resultCached.pools, ...newResource.pools}
    // this.tokens = [...resultCached.tokens, ...newResource.tokens]
    // this.swapLogs = [...resultCached.swapLogs, ...newResource.swapLogs]
    // this.transferLogs = [...resultCached.transferLogs, ...newResource.transferLogs]
  }

  getLastBlockCached(account?: string) {
    if (!this.storage || !this.storage.getItem || !account) return this.profile.configs.derivable.startBlock
    return this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.ACCOUNT_BLOCK_LOGS + '-' + account) || this.profile.configs.derivable.startBlock
  }

  cacheDdlLog({
                logs,
                headBlock,
                account,
              }: {
    logs: any
    headBlock: number
    account: string
  }) {
    if (!this.storage || !this.storage.getItem || !this.storage.setItem || !account) return
    const key = this.chainId + '-' + LOCALSTORAGE_KEY.ACCOUNT_LOGS + '-' + account
    const blockKey = this.chainId + '-' + LOCALSTORAGE_KEY.ACCOUNT_BLOCK_LOGS + '-' + account

    const cachedogs = JSON.parse(this.storage.getItem(key) || '[]')
    const newCacheSwapLogs = [...logs, ...cachedogs].filter((log, index, self) => {
      return index === self.findIndex((t) => t.logIndex === log.logIndex && t.transactionHash === log.transactionHash)
    })
    this.storage.setItem(blockKey, headBlock.toString())
    this.storage.setItem(key, JSON.stringify(newCacheSwapLogs))
  }

  async getWhiteListResource(playMode?: boolean) {
    await this.generateData({
      poolAddresses: this.profile.whitelistPools,
      transferLogs: [],
      playMode
    })
    // this.poolGroups = {...this.poolGroups, ...poolGroups}
    // this.pools = {...this.pools, ...pools}
    // this.tokens = uniqBy([...this.tokens, ...tokens], 'address')
  }

  async getResourceCached(account: string, playMode?: boolean): Promise<ResourceData> {
    const results: ResourceData = {
      pools: {},
      tokens: this._whitelistTokens(),
      swapLogs: [],
      transferLogs: [],
      poolGroups: {},
    }
    const topics = getTopics()

    if (!this.storage || !this.storage.getItem) return results
    const accountLogs = this.parseDdlLogs(JSON.parse(this.storage.getItem(this.chainId + '-' + LOCALSTORAGE_KEY.ACCOUNT_LOGS + '-' + account) || '[]'))

    const swapLogs = accountLogs.filter((log: any) => {
      return log.address && topics.Swap.includes(log.topics[0])
    })
    const transferLogs = accountLogs.filter((log: any) => {
      return log.address && topics.Transfer.includes(log.topics[0])
    })

    const ddlTokenTransferLogs = accountLogs.filter((log: any) => {
      return (
        log.address === this.profile.configs.derivable.token &&
        (topics.TransferSingle.includes(log.topics[0]) || topics.TransferBatch.includes(log.topics[0]))
      )
    })

    const poolAddresses = this.poolHasOpeningPosition(ddlTokenTransferLogs)

    await this.generateData({
      poolAddresses,
      transferLogs,
      playMode
    })

    this.swapLogs = [...this.swapLogs, ...swapLogs]
    this.transferLogs = [...this.transferLogs, ...transferLogs]

    return {
      tokens: this.tokens,
      pools: this.pools,
      poolGroups: this.poolGroups,
      swapLogs: this.swapLogs,
      transferLogs: this.transferLogs,
    }
  }

  async getNewResource(account: string, playMode?: boolean): Promise<ResourceData> {
    // TODO: move this part to constructor
    const etherscanConfig =
      typeof this.scanApi === 'string'
        ? {
          url: this.scanApi,
          maxResults: 1000,
          rangeThreshold: 0,
          rateLimitCount: 1,
          rateLimitDuration: 5000,
          apiKeys: this.scanApiKey ? [this.scanApiKey] : [],
        }
        : this.scanApi

    const provider = new AssistedJsonRpcProvider(this.providerToGetLog, etherscanConfig)
    const lastHeadBlockCached = this.getLastBlockCached(account)
    const accTopic = account ? '0x' + '0'.repeat(24) + account.slice(2) : null
    const topics = getTopics()

    const filterTopics = [
      [null, null, null, null],
      [null, accTopic, null, null],
      [null, null, accTopic, null],
      [null, null, null, accTopic],
    ]

    return await provider
      .getLogs({
        fromBlock: lastHeadBlockCached,
        toBlock: MAX_BLOCK,
        topics: filterTopics,
      })
      .then((logs: LogType[]) => {
        if (!logs?.length) {
          return [[], [], []]
        }
        const headBlock = logs[logs.length - 1]?.blockNumber
        const swapLogs = logs.filter((log: any) => {
          return log.address && topics.Swap.includes(log.topics[0])
        })
        const transferLogs = logs.filter((log: any) => {
          return log.address && topics.Transfer.includes(log.topics[0])
        })

        const ddlTokenTransferLogs = logs.filter((log: any) => {
          return (
            log.address === this.profile.configs.derivable.token &&
            (topics.TransferSingle.includes(log.topics[0]) || topics.TransferBatch.includes(log.topics[0]))
          )
        })

        this.cacheDdlLog({
          logs,
          // transferLogs,
          headBlock,
          account,
        })
        return [this.parseDdlLogs(swapLogs), this.parseDdlLogs(ddlTokenTransferLogs), this.parseDdlLogs(transferLogs)]
      })
      .then(async ([swapLogs, ddlTokenTransferLogs, transferLogs]: any) => {
        const result: ResourceData = {
          pools: {},
          tokens: [],
          swapLogs: [],
          transferLogs: [],
          poolGroups: {},
        }

        if (swapLogs && swapLogs.length > 0) {
          result.swapLogs = swapLogs
        }
        if (transferLogs && transferLogs.length > 0) {
          result.transferLogs = transferLogs
        }
        const poolAddresses = this.poolHasOpeningPosition(ddlTokenTransferLogs)

        if (poolAddresses && poolAddresses.length > 0) {
          const {tokens, pools, poolGroups} = await this.generateData({
            poolAddresses,
            transferLogs,
            playMode
          })
          result.tokens = tokens
          result.pools = pools
          result.poolGroups = poolGroups
        }

        // this.pools = {...result.pools, ...this.pools}
        // this.poolGroups = {...this.poolGroups, ...result.poolGroups}
        // this.pools = {...this.pools, ...result.pools}
        // this.tokens = [...this.tokens, ...result.tokens]
        this.swapLogs = [...this.swapLogs, ...result.swapLogs]
        this.transferLogs = [...this.transferLogs, ...result.transferLogs]

        return result
      })
      .catch((e: any) => {
        console.error(e)
        return {pools: {}, tokens: [], swapLogs: [], transferLogs: []}
      })
  }

  /**
   * parse DDL logs
   * @param poolAddresses
   * @param transferLogs
   * @param playMode
   */
  generateData(
    {
      poolAddresses,
      transferLogs,
      playMode
    }: { poolAddresses: string[], transferLogs: ParseLogType[], playMode?: boolean }) {
    const allTokens: string[] = [...this._tokenInRoutes()]
    // logs.forEach((log) => {
    //   if (log.name === 'PoolCreated') {
    //     const data = log.args
    //     if (!!playMode != (data.TOKEN_R == this.profile.configs.derivable.playToken)) {
    //       return
    //     }
    //     const powers = [log.args.k.toNumber(), -log.args.k.toNumber()]
    //     const pair = ethers.utils.getAddress('0x' + data.ORACLE.slice(-40))
    //     const quoteTokenIndex = bn(data.ORACLE.slice(0, 3)).gt(0) ? 1 : 0
    //     const window = bn('0x' + data.ORACLE.substring(2 + 8, 2 + 8 + 8))
    //
    //     if (this.profile.configs.fetchers[data.FETCHER] == null) {
    //       return
    //     }
    //
    //     data.dTokens = powers.map((value, key) => {
    //       return {power: value, index: key}
    //     })
    //
    //     data.dTokens = (data.dTokens as {
    //       index: number;
    //       power: number
    //     }[]).map((data) => `${log.address}-${data.index}`)
    //
    //     poolData[log.address] = {
    //       ...data,
    //       poolAddress: log.address,
    //       powers,
    //       cToken: data.TOKEN_R,
    //       pair,
    //       window,
    //       quoteTokenIndex,
    //       exp: this.profile.getExp(data),
    //     }
    //
    //     allUniPools.push(pair)
    //     allTokens.push(data.TOKEN_R)
    //   }
    // })

    transferLogs.forEach((log) => {
      allTokens.push(log.address)
    })

    allTokens.push(...this.stableCoins)

    return this.loadInitPoolsData(allTokens, poolAddresses, playMode)
  }

  /**
   * load Token detail, poolstate data and then dispatch to Store
   */
  async loadInitPoolsData(
    listTokens: string[],
    poolAddresses?: string[],
    playMode?: boolean
  ): Promise<{
    tokens: TokenType[]
    pools: any
    poolGroups: any
  }> {
    const multicall = new Multicall({
      multicallCustomContractAddress: this.profile.configs.helperContract.multiCall,
      ethersProvider: this.getPoolOverridedProvider(),
      tryAggregate: true,
    })
    const normalTokens = _.uniq(getNormalAddress(listTokens))

    // const pricesInfo = await this.getPrices(listPools, pairsInfo)

    // @ts-ignore
    const context: ContractCallContext[] = this.getMultiCallRequest(normalTokens, poolAddresses || [])
    const [{results}] = await Promise.all([multicall.call(context)])

    const {tokens: tokensArr, pools} = this.parseMultiCallResponse(results, poolAddresses || [])

    for (let poolAddress in pools) {
      if (!!playMode != (pools[poolAddress].TOKEN_R == this.profile.configs.derivable.playToken)) {
        delete pools[poolAddress]
      }
    }

    const uniPools = Object.values(pools).map((p: { pair: string }) => p.pair)
    const pairsInfo = await this.UNIV3PAIR.getPairsInfo({
      pairAddresses: _.uniq(uniPools),
    })
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

    const poolGroups = {}

    for (const i in pools) {
      // if (!poolsState[i]) {
      //   delete pools[i]
      //   continue
      // }
      // pools[i].states = poolsState[i]
      pools[i] = {
        ...pools[i],
        ...this.calcPoolInfo(pools[i]),
      }

      const {MARK: _MARK, ORACLE, k: _k} = pools[i]

      const quoteTokenIndex = bn(ORACLE.slice(0, 3)).gt(0) ? 1 : 0
      const pair = ethers.utils.getAddress('0x' + ORACLE.slice(-40))

      const baseToken = quoteTokenIndex === 0 ? pairsInfo[pair].token1 : pairsInfo[pair].token0
      const quoteToken = quoteTokenIndex === 0 ? pairsInfo[pair].token0 : pairsInfo[pair].token1

      const tokenR = tokens.find((t) => t.address === pools[i].TOKEN_R)

      pools[i].baseToken = baseToken.address
      pools[i].quoteToken = quoteToken.address

      const k = _k.toNumber()
      const id = [pair].join('-')
      if (poolGroups[id]) {
        poolGroups[id].pools[i] = pools[i]
      } else {
        poolGroups[id] = {pools: {[i]: pools[i]}}
        // poolGroups[id].UTR = pools[i].UTR
        poolGroups[id].pair = pairsInfo[pair]
        poolGroups[id].quoteTokenIndex = quoteTokenIndex
        poolGroups[id].baseToken = pools[i].baseToken
        poolGroups[id].quoteToken = pools[i].quoteToken
        // poolGroups[id].TOKEN = pools[i].TOKEN
        // poolGroups[id].MARK = pools[i].MARK
        // poolGroups[id].INIT_TIME = pools[i].INIT_TIME
        // poolGroups[id].HALF_LIFE = pools[i].HALF_LIFE
        poolGroups[id].ORACLE = pools[i].ORACLE
        poolGroups[id].TOKEN_R = pools[i].TOKEN_R
        // poolGroups[id].states = {
        //   twapBase: poolsState[i].twap,
        //   spotBase: poolsState[i].spot,
        //   ...poolsState[i],
        // }
        poolGroups[id].basePrice = parsePrice(pools[i].states.spot, baseToken, quoteToken, pools[i])
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
        poolGroups[id].dTokens.push(pools[i].poolAddress + '-' + POOL_IDS.A, pools[i].poolAddress + '-' + POOL_IDS.B)
      } else {
        poolGroups[id].dTokens = [pools[i].poolAddress + '-' + POOL_IDS.A, pools[i].poolAddress + '-' + POOL_IDS.B]
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

    this.poolGroups = {...this.poolGroups, ...poolGroups}
    this.pools = {...this.pools, ...pools}
    this.tokens = [...this.tokens, ...tokens]

    return {
      // @ts-ignore
      tokens: _.uniqBy(tokens, 'address'),
      pools,
      poolGroups,
    }
  }

  async searchIndex(keyword?: string) {
    const etherscanConfig =
      typeof this.scanApi === 'string'
        ? {
          url: this.scanApi,
          maxResults: 1000,
          rangeThreshold: 0,
          rateLimitCount: 1,
          rateLimitDuration: 5000,
          apiKeys: this.scanApiKey ? [this.scanApiKey] : [],
        }
        : this.scanApi

    const provider = new AssistedJsonRpcProvider(this.providerToGetLog, etherscanConfig)
    const lastHeadBlockCached = this.profile.configs.derivable.startBlock
    const keyWordTopic = ethers.utils.formatBytes32String(keyword || '')

    const filterTopics = [
      [null, null, null, null],
      [null, keyWordTopic, null, null],
      [null, null, keyWordTopic, null],
      [null, null, null, keyWordTopic],
    ]

    const poolGroups = await provider
      .getLogs({
        fromBlock: lastHeadBlockCached,
        toBlock: MAX_BLOCK,
        topics: filterTopics,
        address: this.profile.configs.derivable.poolDeployer,
      })
      .then((logs: LogType[]) => {
        const _poolGroups = {}
        logs.forEach((log) => {
          const poolData = defaultAbiCoder.decode(this.profile.getEventDataAbi().PoolCreated, log.data)
          const uniPair = ethers.utils.getAddress('0x' + poolData.ORACLE.slice(-40))
          if (_poolGroups[uniPair]?.pools) {
            _poolGroups[uniPair].pools.push(poolData)
          } else {
            _poolGroups[uniPair] = {pools: [poolData]}
          }
        })
        return _poolGroups
      })
    const pairsInfo = await this.UNIV3PAIR.getPairsInfo({pairAddresses: Object.keys(poolGroups)})
    for (let id in poolGroups) {
      poolGroups[id].pairInfo = pairsInfo[id]
    }
    return poolGroups
  }

  async loadPoolStates(poolAddress: string) {
    const pool = this.pools[poolAddress]
    const pairsInfo = await this.UNIV3PAIR.getPairsInfo({
      pairAddresses: [pool.pair],
    })
    const pricesInfo = await this.getPrices({[poolAddress]: pool}, pairsInfo)
    const contract = new Contract(poolAddress, this.profile.getAbi('PoolOverride').abi, this.getPoolOverridedProvider())
    const states = await contract.callStatic.compute(
      this.derivableAddress.token,
      5,
      pricesInfo[poolAddress]?.twap || bn(0),
      pricesInfo[poolAddress]?.spot || bn(0),
    )
    this.pools[poolAddress].states = states
    const baseToken = this.tokens.find(token => token.address === pool.baseToken)
    const quoteToken = this.tokens.find(token => token.address === pool.quoteToken)
    this.poolGroups[pool.pair].basePrice = parsePrice(states.spot, baseToken, quoteToken, pool)
    this.poolGroups[pool.pair].pools = {
      ...this.poolGroups[pool.pair].pools,
      [poolAddress]: pool,
    }
    const rdc = this.getRdc(Object.values(this.poolGroups[pool.pair].pools))
    this.poolGroups[pool.pair].states = {
      ...states,
      ...rdc,
    }

    return [this.poolGroups, this.pools]
  }

  getRentRate({rDcLong, rDcShort, R}: { R: BigNumber; rDcLong: BigNumber; rDcShort: BigNumber }, rentRate: BigNumber) {
    const diff = bn(rDcLong).sub(rDcShort).abs()
    const rate = R.isZero() ? bn(0) : diff.mul(rentRate).div(R)
    return {
      rentRateLong: rDcLong.add(rDcShort).isZero() ? bn(0) : rate.mul(rDcLong).div(rDcLong.add(rDcShort)),
      rentRateShort: rDcLong.add(rDcShort).isZero() ? bn(0) : rate.mul(rDcShort).div(rDcLong.add(rDcShort)),
    }
  }

  getPoolOverridedProvider() {
    const stateOverride = {}
    // poolAddresses.forEach((address: string) => {
    stateOverride[this.derivableAddress.logic as string] = {
      code: this.profile.getAbi('PoolOverride').deployedBytecode,
    }
    if (this.derivableAddress.uniswapV2Fetcher) {
      stateOverride[this.derivableAddress.uniswapV2Fetcher as string] = {
        code: this.profile.getAbi('FetcherV2Override').deployedBytecode,
      }
    }

    // })

    //@ts-ignore
    this.overrideProvider.setStateOverride({
      ...stateOverride,
      [('0x' + this.profile.getAbi('TokensInfo').deployedBytecode.slice(-40)) as string]: {
        code: this.profile.getAbi('TokensInfo').deployedBytecode,
      },
    })
    return this.overrideProvider
  }

  /**
   * get Multicall Request to get List token and poolState data in 1 request to RPC
   */
  getMultiCallRequest(
    normalTokens: string[],
    poolAddresses: string[],
    //@ts-ignore
    pricesInfo: IPriceInfo,
  ) {
    const request: any = [
      {
        reference: 'tokens',
        contractAddress: '0x' + this.profile.getAbi('TokensInfo').deployedBytecode.slice(-40),
        abi: this.profile.getAbi('TokensInfo').abi,
        calls: [
          {
            reference: 'tokenInfos',
            methodName: 'getTokenInfo',
            methodParameters: [normalTokens],
          },
        ],
      },
    ]
    const poolOverrideAbi = this.profile.getAbi('PoolOverride').abi
    poolAddresses.forEach((poolAddress) => {
      request.push({
        // @ts-ignore
        decoded: true,
        reference: 'pools-' + poolAddress,
        contractAddress: poolAddress,
        // @ts-ignore
        abi: poolOverrideAbi,
        calls: [
          {
            reference: 'loadConfig',
            methodName: 'loadConfig',
            methodParameters: [],
          },
          {
            reference: 'compute',
            methodName: 'compute',
            methodParameters: [
              this.derivableAddress.token,
              5,
              bn(0),
              bn(0),
              // pricesInfo[listPools[i].poolAddress]?.twap || bn(0),
              // pricesInfo[listPools[i].poolAddress]?.spot || bn(0),
            ],
          },
        ],
      })
    })

    return request
  }

  parseMultiCallResponse(multiCallData: any, poolAddresses: string[]) {
    const pools = {}
    const tokens = multiCallData.tokens.callsReturnContext[0].returnValues
    const poolOverrideAbi = this.profile.getAbi('PoolOverride').abi
    poolAddresses.forEach((poolAddress) => {
      try {
        const abiInterface = new ethers.utils.Interface(poolOverrideAbi)
        const poolStateData = multiCallData['pools-' + poolAddress].callsReturnContext
        const configEncodeData = abiInterface.encodeFunctionResult('loadConfig', [formatMultiCallBignumber(poolStateData[0].returnValues)])
        const stateEncodeData = abiInterface.encodeFunctionResult('compute', [formatMultiCallBignumber(poolStateData[1].returnValues)])
        const stateData = abiInterface.decodeFunctionResult('compute', stateEncodeData)
        const configData = abiInterface.decodeFunctionResult('loadConfig', configEncodeData)

        pools[poolAddress] = {
          ...configData.config,
          poolAddress,
          k: configData.config.K,
          powers: [configData.config.K.toNumber(), -configData.config.K.toNumber()],
          quoteTokenIndex: bn(configData.config.ORACLE.slice(0, 3)).gt(0) ? 1 : 0,
          window: bn('0x' + configData.config.ORACLE.substring(2 + 8, 2 + 8 + 8)),
          pair: ethers.utils.getAddress('0x' + configData.config.ORACLE.slice(-40)),
          states: {
            ...stateData.stateView,
            ...stateData.stateView.state,
          },
        }
      } catch (e) {
        console.error('Cannot get states of: ', poolAddress)
        console.error(e)
      }
    })

    return {tokens, pools}
  }

  calcPoolInfo(pool: PoolType) {
    const {MARK, states, FETCHER} = pool
    const {R, rA, rB, rC, a, b, spot} = states
    const exp = this.profile.getExp(FETCHER)
    const riskFactor = rC.gt(0) ? div(rA.sub(rB), rC) : '0'
    const deleverageRiskA = R.isZero()
      ? 0
      : rA
      .mul(2 * this.unit)
      .div(R)
      .toNumber() / this.unit
    const deleverageRiskB = R.isZero()
      ? 0
      : rB
      .mul(2 * this.unit)
      .div(R)
      .toNumber() / this.unit
    const k = pool.k.toNumber()
    const power = k / exp
    const sides = {
      [A]: {} as any,
      [B]: {} as any,
      [C]: {} as any,
    }
    sides[A].k = Math.min(k, kx(k, R, a, spot, MARK))
    sides[B].k = Math.min(k, kx(-k, R, b, spot, MARK))
    sides[C].k = numDiv(
      rA
        .mul(Math.round(sides[A].k * this.unit))
        .add(rB.mul(Math.round(sides[B].k * this.unit)))
        .div(rA.add(rB)),
      this.unit,
    )

    const interestRate = rateFromHL(pool.INTEREST_HL.toNumber(), power)
    const maxPremiumRate = rateFromHL(pool.PREMIUM_HL.toNumber(), power)
    if (maxPremiumRate > 0) {
      if (rA.gt(rB)) {
        const rDiff = rA.sub(rB)
        const givingRate = rDiff.mul(Math.round(this.unit * maxPremiumRate))
        const receivingRate = numDiv(givingRate.div(rB.add(rC)), this.unit)
        sides[A].premium = numDiv(givingRate.div(rA), this.unit)
        sides[B].premium = -receivingRate
        sides[C].premium = receivingRate
      } else if (rB.gt(rA)) {
        const rDiff = rB.sub(rA)
        const givingRate = rDiff.mul(Math.round(this.unit * maxPremiumRate))
        const receivingRate = numDiv(givingRate.div(rA.add(rC)), this.unit)
        sides[B].premium = numDiv(givingRate.div(rB), this.unit)
        sides[A].premium = -receivingRate
        sides[C].premium = receivingRate
      } else {
        sides[A].premium = 0
        sides[B].premium = 0
        sides[C].premium = 0
      }
    }

    // decompound the interest
    for (const side of [A, B]) {
      sides[side].interest = (interestRate * k) / sides[side].k
    }
    sides[C].interest = numDiv(
      rA
        .add(rB)
        .mul(Math.round(this.unit * interestRate))
        .div(rC),
      this.unit,
    )

    return {
      sides,
      riskFactor,
      deleverageRiskA,
      deleverageRiskB,
      interestRate,
      maxPremiumRate,
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
    const eventInterface = new ethers.utils.Interface(this.profile.getAbi('Events'))
    return ddlLogs.map((log: any) => {
      return {
        ...log,
        ...eventInterface.parseLog(log)
      }
    })
  }

  _tokenInRoutes() {
    return Object.keys(this.profile.routes).reduce((results, pair) => {
      return [...results, ...pair.split('-')]
    }, [] as string[])
  }

  _whitelistTokens(): TokenType[] {
    const result = []
    const tokens = this.profile.configs.tokens
    for (let address in tokens) {
      result.push({
        address,
        logo: tokens[address].logo,
        name: tokens[address].name,
        symbol: tokens[address].symbol,
        decimal: tokens[address].decimals,
      })
    }
    return result
  }

  async getPrices(pools: { [key: string]: PoolType }, pairs: IPairsInfo): Promise<IPriceInfo> {
    const blockNumber = await this.overrideProvider.getBlockNumber()

    const result = {}
    const res = await Promise.all(
      Object.values(pools)
        .filter((pool) => pool.exp == 1)
        .map((pool) => {
          return this.getPrice(pool, blockNumber, pairs[pool.pair])
        }),
    )
    res.forEach((priceInfo) => {
      result[priceInfo.poolAddress] = {spot: priceInfo.spot, twap: priceInfo.twap}
    })
    return result
  }

  async getPrice(pool: PoolType, blockNumber: number, pair: IPairInfo) {
    const getStorageAt = OracleSdkAdapter.getStorageAtFactory(this.overrideProvider)
    const getBlockByNumber = OracleSdkAdapter.getBlockByNumberFactory(this.overrideProvider)

    const twap = await OracleSdk.getPrice(
      getStorageAt,
      getBlockByNumber,
      pool.pair,
      pool.quoteTokenIndex,
      blockNumber - (pool.window.toNumber() >> 1),
    )

    let spot
    const [r0, r1] = [pair.token0.reserve, pair.token1.reserve]
    if (pool.quoteTokenIndex == 0) {
      spot = r0.shl(128).div(r1)
    } else {
      spot = r1.shl(128).div(r0)
    }

    return {
      poolAddress: pool.poolAddress,
      twap: twap.shl(16),
      spot: twap.eq(0) ? bn(0) : spot,
    }
  }

  getSingleRouteToUSD(token: string, types: string[] = ['uniswap3']) {
    const {
      routes,
      configs: {stablecoins},
    } = this.profile
    for (const stablecoin of stablecoins) {
      for (const asSecond of [false, true]) {
        const key = asSecond ? stablecoin + '-' + token : token + '-' + stablecoin
        const route = routes[key]
        if (route?.length != 1) {
          continue
        }
        const {type, address} = route[0]
        if (!types.includes(type)) {
          continue
        }
        const quoteTokenIndex = token.localeCompare(stablecoin, undefined, {sensitivity: 'accent'}) < 0 ? 1 : 0
        return {
          quoteTokenIndex,
          stablecoin,
          address,
        }
      }
    }
    return undefined
  }

  poolHasOpeningPosition(tokenTransferLogs: LogType[]): string[] {
    const balances: { [id: string]: BigNumber } = {}
    tokenTransferLogs.forEach((log) => {
      const tokenId = log.args.id.toString()
      if (log.args.from === this.account) {
        balances[tokenId] = balances[tokenId] ? balances[tokenId].sub(log.args.value) : bn(0).sub(log.args.value)
        if (balances[tokenId].isZero()) delete balances[tokenId]
      } else {
        balances[tokenId] = balances[tokenId] ? balances[tokenId].add(log.args.value) : log.args.value
      }
    })

    // unpack id to get Pool address
    return _.uniq(Object.keys(balances).map((id) => unpackId(bn(id)).p))
  }
}
