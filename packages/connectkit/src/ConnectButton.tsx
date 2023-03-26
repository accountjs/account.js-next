import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { useContractAccount } from './hooks'
import { useIsMounted } from './hooks/useIsMounted'

export const ConnectButton = ({ customAccount }: { customAccount?: string }) => {
  const { connect } = useConnect({
    connector: new InjectedConnector()
  })
  const { disconnect } = useDisconnect()
  const [ownerAddress, setOwnerAddress] = useState<string>()
  const { address: fallbackOwnerAddress, isConnected } = useAccount()
  const contractAccount = useContractAccount(customAccount)

  useEffect(() => {
    ;(async () => {
      try {
        const owner = await contractAccount?.getOwner()
        setOwnerAddress(owner)
      } catch {
        setOwnerAddress(fallbackOwnerAddress)
      }
    })()
  }, [contractAccount])

  const isMounted = useIsMounted()
  if (!isMounted) {
    return null
  }

  if (isConnected) {
    return (
      <div className="acck-flex acck-flex-col">
        <span>Eoa Address: {ownerAddress}</span>
        <span>SCW Address: {contractAccount?.getAddress()}</span>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  }

  return (
    <button className="" onClick={() => connect()}>
      Connect Wallet
    </button>
  )
}
