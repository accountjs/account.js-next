import { PrivateRecoveryAccount } from '@accountjs/sdk'
import { useState, useEffect } from 'react'
import { useNetwork, useSigner } from 'wagmi'
import { useConnectKitContext } from '../ConnectKitProvider'

export function useContractAccount() {
  const { chain } = useNetwork()
  const { data: signer } = useSigner()
  const [account, setAccount] = useState<PrivateRecoveryAccount>()
  const { customContracts } = useConnectKitContext()

  useEffect(() => {
    ;(async () => {
      if (!signer || !chain?.id) {
        return
      }

      try {
        const account = await PrivateRecoveryAccount.create({
          signer,
          customContracts
        })
        setAccount(account)
      } catch (e) {
        console.log('💣 ~ file: ConnectButton.tsx:28 ~ ; ~ e:', e)
        throw e
      }
    })()
  }, [signer, chain, customContracts])

  return account
}
