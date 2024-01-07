import { BatchInterceptor } from '@mswjs/interceptors'
import { ClientRequestInterceptor } from '@mswjs/interceptors/ClientRequest'
import objHash from 'object-hash'
import * as path from 'path'
import * as fs from 'fs'

export const interceptorUtils = () => {
  try {
    const interceptor = new BatchInterceptor({
      name: 'batch-interceptor',
      interceptors: [new ClientRequestInterceptor()],
    })

    interceptor.apply()

    interceptor.on('request', async ({ request }) => {
      try {
        if (request.url.endsWith('.json')) {
          return
        }
        const requestId = await calcRequestID(request)
        const resourcePath = path.join(__dirname, `../resources/${requestId}.json`)
        const resourceData = fs.readFileSync(resourcePath, 'utf8')
        if (resourceData) {
          const response = new Response(resourceData)
          request.respondWith(response)
        }
      } catch (error) {
        return
      }
    })

    interceptor.on('response', async ({ response, isMockedResponse, request }) => {
      try {
        if (request.url.endsWith('.json') || isMockedResponse) {
          return
        }
        const requestId = await calcRequestID(request)
        const resourcePath = path.join(__dirname, `../resources/${requestId}.json`)
        const resourceData = {
          type: response.type,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: (await response.clone().json()) ?? {},
        }
        fs.writeFileSync(resourcePath, JSON.stringify(resourceData))
      } catch (error) {
        return
      }
    })
  } catch (error) {
    return
  }
}

const calcRequestID = async (request: Request): Promise<string | undefined> => {
  try {
    if (request.method === 'POST') {
      const body = await request.clone().json()
      delete body.id
      return objHash({
        url: request.url,
        body,
      })
    }
    return objHash(request.url)
  } catch (error) {
    return undefined
  }
}
