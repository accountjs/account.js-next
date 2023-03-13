import '@/styles/globals.css'
import { getDefaultProvider } from 'ethers'
import type { AppProps } from 'next/app'
import { createClient, WagmiConfig } from 'wagmi'

const client = createClient({
  autoConnect: false,
  provider: getDefaultProvider()
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={client}>
      <Component {...pageProps} />
    </WagmiConfig>
  )
}
