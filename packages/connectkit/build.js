/* eslint-disable no-console, import/no-unresolved, import/no-extraneous-dependencies */
import * as esbuild from 'esbuild'

const isWatching = process.argv.includes('--watch')

/** @type {import('esbuild').BuildOptions} */
const buildConfig = {
  bundle: true,
  format: 'esm',
  loader: {
    '.png': 'dataurl',
    '.svg': 'dataurl'
  },
  platform: 'browser',
  plugins: [
    {
      name: 'make-all-packages-external',
      setup(build) {
        let filter = /^[^./]|^\.[^./]|^\.\.[^/]/ // Must not start with "/" or "./" or "../"
        build.onResolve({ filter }, (args) => ({
          external: true,
          path: args.path
        }))
      }
    }
  ],
  splitting: true, // Required for tree shaking
  entryPoints: ['./src/index.ts'],
  outdir: 'dist'
}

const build = () => esbuild.build(buildConfig)

const main = async () => {
  if (isWatching) {
    return esbuild.context(buildConfig).then((ctx) => ctx.watch())
  }

  return build()
}

main()
  .then(() => {
    if (isWatching) {
      console.log('watching...')
    }
  })
  .catch((e) => {
    console.log('💣 Building error:', e)
    process.exit(1)
  })
