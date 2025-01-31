import { createServer, IncomingMessage } from 'http'
import * as process from 'process'
import { InertiaAppResponse, Page } from './types'
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';

type AppCallback = (page: Page) => InertiaAppResponse
type RouteHandler = (request: IncomingMessage) => Promise<unknown>
type ServerOptions = {
  port?: number
  cluster?: boolean
}
type Port = number

const readableToString: (readable: IncomingMessage) => Promise<string> = (readable) =>
  new Promise((resolve, reject) => {
    let data = ''
    readable.on('data', (chunk) => (data += chunk))
    readable.on('end', () => resolve(data))
    readable.on('error', (err) => reject(err))
  })

export default (render: AppCallback, options?: Port | ServerOptions): void => {
  const _port = typeof options === 'number' ? options : options?.port ?? 13714;
  const _useCluster = typeof options === 'object' && options?.cluster !== undefined ? options.cluster : false;

  const log = (message: string) => {
    console.log(_useCluster && !cluster.isPrimary ? `[${cluster.worker?.id ?? 'N/A'} / ${cluster.worker?.process?.pid ?? 'N/A'}] ${message}` : message)
  }

  if (_useCluster && cluster.isPrimary) {
    log('Primary Inertia SSR server process started...')

    for (let i = 0; i < availableParallelism(); i++) {
      cluster.fork()
    }

    return
  }

  const routes: Record<string, RouteHandler> = {
    '/health': async () => ({ status: 'OK', timestamp: Date.now() }),
    '/shutdown': () => process.exit(),
    '/render': async (request) => render(JSON.parse(await readableToString(request))),
    '/404': async () => ({ status: 'NOT_FOUND', timestamp: Date.now() }),
  }

  createServer(async (request, response) => {
    const dispatchRoute = routes[<string>request.url] || routes['/404']

    try {
      response.writeHead(200, { 'Content-Type': 'application/json', Server: 'Inertia.js SSR' })
      response.write(JSON.stringify(await dispatchRoute(request)))
    } catch (e) {
      console.error(e)
    }

    response.end()
  }).listen(_port, () => log('Inertia SSR server started.'))

  log(`Starting SSR server on port ${_port}...`)
}
