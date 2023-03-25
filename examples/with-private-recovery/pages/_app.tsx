import '@/styles/globals.css'
import '@accountjs/connect/dist/index.css'
import type { AppProps } from 'next/app'
import { configureChains, createClient, WagmiConfig } from 'wagmi'
import { goerli, hardhat } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { infuraProvider } from 'wagmi/providers/infura'
import { ConnectKitProvider } from '@accountjs/connect'
import { LOCAL_CONFIG } from '@/config'

const chains = [process.env.NODE_ENV === 'development' ? hardhat : goerli]

const { provider, webSocketProvider } = configureChains(chains, [
  infuraProvider({
    apiKey: process.env.NEXT_PUBLIC_INFURA_ID!
  }),
  publicProvider()
])

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider
        customContracts={{
          accountFactoryAddress: LOCAL_CONFIG.privateRecoveryAccountFactory,
          entryPointAddress: LOCAL_CONFIG.entryPoint
        }}
        bundlerUrl={LOCAL_CONFIG.bundlerUrl}
      >
        <Component {...pageProps} />
      </ConnectKitProvider>
    </WagmiConfig>
  )
}
