import { Account } from '@accountjs/sdk'
import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useSigner } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { useIsMounted } from './hooks/useIsMounted'

export const ConnectButton = () => {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector()
  })
  const { data: signer } = useSigner()
  const { disconnect } = useDisconnect()

  const [scwAddress, setScwAddress] = useState<string>()

  useEffect(() => {
    ;(async () => {
      if (!signer) {
        return
      }

      const account = await Account.create({ signer })
      setScwAddress(account.getAddress())
    })()
  }, [signer])

  const isMounted = useIsMounted()
  if (!isMounted) {
    return null
  }

  if (isConnected) {
    return (
      <div>
        <span>Eoa Address: {address}</span>
        <span>SCW Address: {scwAddress}</span>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  }
  return <button onClick={() => connect()}>Connect Wallet</button>
}
