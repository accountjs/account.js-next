import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useChainId } from 'wagmi'
import { ContractConfig, DEPLOYMENTS } from '@accountjs/sdk'
import { ServiceClient } from '@accountjs/service-client'

interface ConnectKitProviderProps {
  bundlerUrl: string
  children: ReactNode
  customContracts?: ContractConfig
}

interface ConnectKitContextValue {
  serviceClient: ServiceClient | null
  customContracts?: ContractConfig
}

const ConnectKitContext = createContext<ConnectKitContextValue | null>(null)
export const useConnectKitContext = () => {
  const connectKitContext = useContext(ConnectKitContext)

  if (!connectKitContext) {
    throw new Error('ConnectKit hooks must be used within ConnectKitProvider')
  }

  return connectKitContext
}
export const useServiceClient = () => {
  const { serviceClient } = useConnectKitContext()
  return serviceClient
}

export function ConnectKitProvider({
  children,
  bundlerUrl,
  customContracts
}: ConnectKitProviderProps) {
  const chainId = useChainId()
  const [serviceClient, setServiceClient] = useState<ServiceClient | null>(null)

  useEffect(() => {
    if (!chainId) {
      return
    }

    ;(async () => {
      const entryPointAddress =
        customContracts?.entryPointAddress ?? DEPLOYMENTS.entryPoint.networkAddresses[chainId]
      const client = new ServiceClient({ chainId, bundlerUrl, entryPointAddress })
      setServiceClient(client)
    })()
  }, [])

  return (
    <ConnectKitContext.Provider value={{ customContracts, serviceClient }}>
      <div data-acck>{children}</div>
    </ConnectKitContext.Provider>
  )
}
