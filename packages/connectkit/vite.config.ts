import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
// import tsconfigPaths from 'vite-tsconfig-paths'

import pkg from './package.json'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: Object.keys(pkg.peerDependencies)
    }
  },
  plugins: [
    // tsconfigPaths(),
    dts({
      beforeWriteFile: (filePath, content) => ({
        content,
        filePath: filePath.replace('src', '')
      }),
      compilerOptions: {
        baseUrl: './src/',
        emitDeclarationOnly: true,
        noEmit: false
      },
      outputDir: 'dist/types'
    })
  ]
})
