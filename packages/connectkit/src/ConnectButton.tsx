import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { useContractAccount } from './hooks'
import { useIsMounted } from './hooks/useIsMounted'

export const ConnectButton = () => {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector()
  })
  const { disconnect } = useDisconnect()
  const contractAccount = useContractAccount()

  const isMounted = useIsMounted()
  if (!isMounted) {
    return null
  }

  if (isConnected) {
    return (
      <div className="acck-flex acck-flex-col">
        <span>Eoa Address: {address}</span>
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
