/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // use this to fix external libraries require errors
    esmExternals: 'loose'
  },
  transpilePackages: ['@accountjs/sdk']
  // webpack: (config) => {
  //   config.module.rules.push({
  //     test: /\.(ts)x?$/, // Just `tsx?` file only
  //     use: [
  //       // options.defaultLoaders.babel, I don't think it's necessary to have this loader too
  //       {
  //         loader: 'ts-loader',
  //         options: {
  //           transpileOnly: true,
  //           experimentalWatchApi: true,
  //           onlyCompileBundledFiles: true
  //         }
  //       }
  //     ]
  //   })

  //   return config
  // }
}

module.exports = nextConfig
