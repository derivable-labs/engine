import { Engine } from '../src/engine'
import { getTestConfigs } from './shared/testConfigs'

const chainId = Number(process.env.CHAIN ?? 42161)
const wallet = process.env.WALLET ?? '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'

const objHash = require('object-hash');

async function calcRequestID(request: any): Promise<string> {
  // console.log(request)
  if (request.method === 'POST') {
    const body = await request.clone().json()
    delete body.id
    return objHash({
      url: request.url,
      body: body,
    })
  }
  return objHash(request.url)
}

const fs = require('fs')

import { ClientRequestInterceptor } from '@mswjs/interceptors/ClientRequest'
const interceptor = new ClientRequestInterceptor()

// Enable the interception of requests.
interceptor.apply()

// Listen to any "http.ClientRequest" being dispatched,
// and log its method and full URL.
interceptor.on('request', async ({ request }) => {
  const id = await calcRequestID(request)
  console.log(id)
  try {
    const json = await fs.readFileSync(`example/data/${id}.json`, 'utf8')
    if (json) {
      console.log(json)
      // const res = JSON.parse(json)
      // console.log(res)
      // request.respondWith(new Response(res))
    }
  } catch (err) {
  }
})

// Listen to any responses sent to "http.ClientRequest".
// Note that this listener is read-only and cannot affect responses.
interceptor.on('response', async ({ response, isMockedResponse, request }) => {
  if (isMockedResponse) {
    return
  }
  const id = await calcRequestID(request)
  const responseClone: Response = response.clone()
  const res = {
    type: responseClone.type,
    status: responseClone.status,
    statusText: responseClone.statusText,
    // headers: responseClone.headers,
    // headers: Object.fromEntries(responseClone.headers.entries()),
  }
  try {
    // @ts-ignore
    res.headers = Object.fromEntries(responseClone.headers.entries())
  } catch (err) {
  }
  try {
    const body = await responseClone.json()
    delete body.id
    // @ts-ignore
    res.body = body
  } catch (err) {
  }
  console.log('response', id, res)

  await fs.writeFileSync(`example/data/${id}.json`, JSON.stringify(res))
})

const testLocal = async () => {
  const configs = getTestConfigs(chainId)
  configs.scanApiKey = process.env['SCAN_API_KEY_' + chainId]
  const engine = new Engine(configs)
  await engine.initServices()

  await engine.RESOURCE.fetchResourceData(
    [],
    wallet,
  )

  console.log({
    pools: engine.RESOURCE.pools,
    tokens: engine.RESOURCE.tokens,
    swapLogs: engine.RESOURCE.swapLogs,
  })

  const currentPool = engine.RESOURCE.poolGroups['0x9E37cb775a047Ae99FC5A24dDED834127c4180cD']
  engine.setCurrentPool({
    ...currentPool,
  })

  const swapTxs = engine?.HISTORY.formatSwapHistory({
    tokens: engine.RESOURCE.tokens,
    transferLogs: JSON.parse(JSON.stringify(engine.RESOURCE.transferLogs)),
    swapLogs: JSON.parse(JSON.stringify(engine.RESOURCE.swapLogs)),
  })
  console.log(swapTxs)

  const positions = engine?.HISTORY.generatePositions({
    tokens: engine.RESOURCE.tokens,
    logs: JSON.parse(JSON.stringify(engine.RESOURCE.swapLogs)),
  })

  console.log(positions)
}

testLocal()
