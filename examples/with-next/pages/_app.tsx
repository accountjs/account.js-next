import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { configureChains, createClient, goerli, WagmiConfig } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { infuraProvider } from 'wagmi/providers/infura'

const { provider, webSocketProvider } = configureChains(
  [goerli],
  [
    infuraProvider({
      apiKey: process.env.NEXT_PUBLIC_INFURA_ID!
    }),
    publicProvider()
  ]
)

const client = createClient({
  autoConnect: false,
  provider,
  webSocketProvider
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={client}>
      <Component {...pageProps} />
    </WagmiConfig>
  )
}
