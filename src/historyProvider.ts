import { numberToWei, weiToNumber } from './utils/helper'
import { TokenType } from './types'
import fetch from 'node-fetch'

const history = {}

const CHART_API_ENDPOINT = 'https://api-chart-{chartId}.derivable.org/'

const convertResolution = (oldResolution: string) => {
  if (oldResolution.includes('D')) {
    return oldResolution
  } else {
    if (Number(oldResolution) < 60) {
      return oldResolution
    } else {
      return Number(oldResolution) / 60 + 'H'
    }
  }
}

export const resolutionToPeriod = {
  5: '5m',
  15: '15m',
  60: '1h',
  240: '4h',
  '1D': '1d',
}

export type CandleType = {
  low: number | string
  open: number | string
  time: number
  close: number | string
  high: number | string
  volume: number | string
}

export type CandleFromApiType = {
  s: string
  t: number[]
  o: string[]
  c: string[]
  l: string[]
  h: string[]
  v: string[]
}

type GetPricesType = {
  data: { [key: string]: string }
  code: number
}

export default {
  history: history,

  getBars: async function ({
    route,
    resolution,
    inputToken,
    outputToken,
    limit,
    chainId,
    to,
    barValueType,
  }: {
    inputToken: TokenType
    outputToken: TokenType
    route: string
    resolution: string
    limit: number
    chainId: string
    to: number
    barValueType?: 'string'
  }): Promise<CandleType[]> {
    const q = route.split('/').join(',')
    const url = `${CHART_API_ENDPOINT.replaceAll('{chartId}', chainId)}candleline4?q=${q}&r=${convertResolution(
      resolution,
    )}&l=${limit}&t=${to}`

    try {
      const response = await fetch(url).then((r: any) => r.json())
      if (response && response.s === 'ok' && response.t && response.t.length > 0) {
        const bars: CandleType[] = []
        const decimals = 18 + (outputToken?.decimals || 18) - (inputToken?.decimals || 18)
        for (let i = 0; i < response.t.length; i++) {
          bars.push({
            low: formatResult(weiToNumber(numberToWei(response.l[i]), decimals), barValueType),
            open: formatResult(weiToNumber(numberToWei(response.o[i]), decimals), barValueType),
            time: response.t[i] * 1000,
            volume: formatResult(weiToNumber(response.v[i].split('.')[0], outputToken?.decimals), barValueType),
            close: formatResult(weiToNumber(numberToWei(response.c[i]), decimals), barValueType),
            high: formatResult(weiToNumber(numberToWei(response.h[i]), decimals), barValueType),
          })
        }
        return bars
      }
    } catch (e) {
      console.error(e)
    }
    return []
  },
}

const formatResult = (value: string, type: undefined | 'string' | 'number') => {
  if (type === 'string') {
    return value
  }
  return Number(value)
}
