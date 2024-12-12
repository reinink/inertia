import type { Plugin } from 'vite'
import { readableToString } from './serverUtils'

interface PluginConfig {
  renderer: string
}

export default function inertia(config: string | PluginConfig): Plugin {
  const resolvedConfig = resolveConfig(config)

  return {
    name: '@inertiajs/core/vite',
    async configureServer(server) {
      return () =>
        server.middlewares.use(async (req, res, next) => {
          if (req.url !== '/render') {
            next()
          }

          const { default: render } = await server.ssrLoadModule(resolvedConfig.renderer)
          const response = await render(JSON.parse(await readableToString(req)))
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(response))
        })
    },
  }
}

function resolveConfig(config: string | PluginConfig) {
  if (typeof config === 'undefined') {
    throw new Error('@inertiajs/core/vite: missing configuration.')
  }

  if (typeof config === 'string') {
    return { renderer: config }
  }

  if (typeof config.renderer === 'undefined') {
    throw new Error('@inertiajs/core/vite: missing configuration for "renderer".')
  }

  return config
}
