import { bn, getTopics, isErc1155Address } from '../utils/helper'
import { BigNumber } from 'ethers'
import { LARGE_VALUE, NATIVE_ADDRESS } from '../utils/constant'
import BnAAbi from '../abi/BnA.json'
import { AllowancesType, BalancesType, MaturitiesType } from '../types'
import { IEngineConfig } from '../utils/configs'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Profile } from '../profile'
import { Resource } from './resource'
import _ from 'lodash'
import { getAddress } from 'ethers/lib/utils'

const TOPICS = getTopics()

function keyFromTokenId(id: BigNumber): string {
  const s = id.toHexString()
  const side = Number.parseInt(s.substring(2, 4), 16)
  const pool = getAddress('0x' + s.substring(4))
  return pool + '-' + side
}

export type BnAReturnType = {
  chainId: number
  account: string
  balances: BalancesType
  allowances: AllowancesType
  maturity: MaturitiesType
}

export class BnA {
  account?: string
  provider: JsonRpcProvider
  rpcUrl: string
  bnAAddress: string
  profile: Profile
  RESOURCE: Resource

  constructor(config: IEngineConfig  & { RESOURCE: Resource }, profile: Profile) {
    this.account = config.account ?? config.signer?._address
    this.provider = new JsonRpcProvider(profile.configs.rpc)
    this.bnAAddress = `0x${BnAAbi.deployedBytecode.slice(-40)}`
    this.profile = profile
    this.RESOURCE = config.RESOURCE
  }

  // TODO: change tokens to a bool flag for native balance
  async getBalanceAndAllowance(tokens: Array<string>): Promise<BnAReturnType> {
    if (!this.account) {
      throw new Error('missing account')
    }
    try {
      // get native balance
      let nativeBalancePromise: Promise<BigNumber> | undefined
      if (tokens.includes(NATIVE_ADDRESS)) {
        nativeBalancePromise = this.provider.getBalance(this.account)
      }

      const balances: { [token: string]: BigNumber } = {}
      const allowances: AllowancesType = {}
      const maturity: MaturitiesType = {}

      const logs = this.RESOURCE.bnaLogs.sort((a, b) =>
        a.blockNumber - b.blockNumber || a.logIndex - b.logIndex
      )
      for (const log of logs) {
        if (!log.args) {
          console.error('Unparsed log', log)
          continue
        }
        const token = log.address
        if (TOPICS.Transfer.includes(log.topics[0])) {
          const { from, to, value } = log.args
          if (to == this.account) {
            balances[token] = (balances[token] ?? bn(0)).add(value)
          }
          if (from == this.account) {
            balances[token] = (balances[token] ?? bn(0)).sub(value)
          }
          if (balances[token].isZero()) {
            delete balances[token]
          }
        }
        if (TOPICS.Approval.includes(log.topics[0])) {
          const { owner, spender, value } = log.args
          if (owner == this.account && spender == this.profile.configs.helperContract.utr) {
            if (value.isZero()) {
              delete allowances[token]
            } else {
              allowances[token] = value
            }
          }
        }
        if (token != this.profile.configs.derivable.token) {
          // not our 1155 token, don't care
          continue
        }
        if (TOPICS.TransferSingle.includes(log.topics[0])) {
          const { from, to, id, value } = log.args
          const key = keyFromTokenId(id)
          allowances[key] = bn(LARGE_VALUE)
          if (to == this.account) {
            balances[key] = (balances[key] ?? bn(0)).add(value)
            maturity[key] = bn(log.timeStamp)
          }
          if (from == this.account) {
            balances[key] = (balances[key] ?? bn(0)).sub(value)
            if (balances[key].isZero()) {
              delete balances[key]
            }
          }
        }
        if (TOPICS.TransferBatch.includes(log.topics[0])) {
          const { from, to, ids, value } = log.args
          for (const id of ids) {
            const key = keyFromTokenId(id)
            allowances[key] = bn(LARGE_VALUE)
            if (to == this.account) {
              balances[key] = (balances[key] ?? bn(0)).add(value)
              maturity[key] = bn(log.timeStamp)
            }
            if (from == this.account) {
              balances[key] = (balances[key] ?? bn(0)).sub(value)
              if (balances[key].isZero()) {
                delete balances[key]
              }
            }
          }
        }
        if (TOPICS.ApprovalForAll.includes(log.topics[0])) {
          // TODO: handle 1155 Approval events
        }
      }
      // calculate the MATURITY assume that each 
      for (const key of Object.keys(balances)) {
        if (!isErc1155Address(key)) {
          continue
        }
        const [poolAddress] = key.split('-')
        const MATURIY = this.RESOURCE.pools[poolAddress]?.MATURITY
        if (MATURIY) {
          maturity[key] = MATURIY.add(maturity[key] ?? 0)
        }
      }
      // await the native balance response
      if (nativeBalancePromise) {
        balances[NATIVE_ADDRESS] = await nativeBalancePromise
      }
      return {
        chainId: this.profile.chainId,
        account: this.account,
        balances,
        allowances,
        maturity,
      }
    } catch (error) {
      throw error
    }
  }
}
