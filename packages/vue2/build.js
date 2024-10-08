#!/usr/bin/env node
import * as esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

const watch = process.argv.slice(1).includes('--watch')

const config = {
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  plugins: [
    nodeExternalsPlugin(),
    rebuildLogger(),
  ],
}

const builds = [
  { entryPoints: ['src/index.ts'], format: 'esm', outfile: 'dist/index.esm.js', platform: 'browser' },
  { entryPoints: ['src/index.ts'], format: 'cjs', outfile: 'dist/index.js', platform: 'browser' },
  { entryPoints: ['src/server.ts'], format: 'esm', outfile: 'dist/server.esm.js', platform: 'node' },
  { entryPoints: ['src/server.ts'], format: 'cjs', outfile: 'dist/server.js', platform: 'node' },
]

try {
  const buildContexts = await Promise.all(builds.map(build => esbuild.context({ ...config, ...build })))

  await Promise.all(buildContexts.map(async (ctx, index) => {
    if (watch) {
      await ctx.watch()
    } else {
      await ctx.rebuild()
      await ctx.dispose()
    }

    console.log(`${watch ? 'Watching' : 'Built'} ${builds[index].entryPoints} (${builds[index].format})...`)
  }))

  watch && console.log('Watching for changes. Press Ctrl+C to exit.')
} catch (error) {
  process.exit(1)
}

function rebuildLogger() {
  return {
    name: 'rebuild-logger',
    setup(build) {
      let ignoreFirstRun = true
  
      build.onEnd(() => {
        if (ignoreFirstRun) {
          ignoreFirstRun = false
          return
        }
  
        console.log(`Rebuilt ${build.initialOptions.entryPoints} (${build.initialOptions.format})…`)
      })
    },
  }
}