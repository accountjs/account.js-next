import * as esbuild from 'esbuild'
import esbuildStylePlugin from 'esbuild-style-plugin'
import path from 'path'

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
  bundle: true,
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
    },
    esbuildStylePlugin({
      postcssConfigFile: path.resolve('.', 'postcss.config.cjs')
    })
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
