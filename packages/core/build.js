#!/usr/bin/env node
import esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

const watch = process.argv.slice(1).includes('--watch')

const config = {
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  plugins: [nodeExternalsPlugin()],
}

const builds = [
  { entryPoints: ['src/index.ts'], format: 'esm', outfile: 'dist/index.esm.js', platform: 'browser' },
  { entryPoints: ['src/index.ts'], format: 'cjs', outfile: 'dist/index.js', platform: 'browser' },
  { entryPoints: ['src/server.ts'], format: 'esm', outfile: 'dist/server.esm.js', platform: 'node' },
  { entryPoints: ['src/server.ts'], format: 'cjs', outfile: 'dist/server.js', platform: 'node' },
  { entryPoints: ['src/vite.ts'], format: 'esm', outfile: 'dist/vite.js', platform: 'node' },
]

builds.forEach((build) => {
  esbuild
    .build({ ...config, ...build, ...watcher(build) })
    .then(() => console.log(`${watch ? 'Watching' : 'Built'} ${build.entryPoints} (${build.format})…`))
    .catch(() => process.exit(1))
})

function watcher(build) {
  return watch
    ? {
        watch: {
          onRebuild: (error) =>
            error
              ? console.error('Watch failed:', error)
              : console.log(`Rebuilding ${build.entryPoints} (${build.format})…`),
        },
      }
    : {}
}
