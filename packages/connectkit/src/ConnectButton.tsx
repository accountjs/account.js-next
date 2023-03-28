import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useContractAccount } from './hooks'
import { useIsMounted } from './hooks/useIsMounted'

export const ConnectButton = ({ customAccount }: { customAccount?: string }) => {
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
        <span>EOA Address: {ownerAddress}</span>
        <span>SCW Address: {contractAccount?.getAddress()}</span>
      </div>
    )
  }

  return null

  // return (
  //   <button className="" onClick={() => connect()}>
  //     Connect Wallet
  //   </button>
  // )
}
