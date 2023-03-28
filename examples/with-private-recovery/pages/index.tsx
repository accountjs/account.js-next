import Head from 'next/head'
import cx from 'clsx'
import { useEffect, useState } from 'react'
import { genPrivKey } from 'maci-crypto'
// @ts-expect-error there is no typing for circomlibjs yet
import { eddsa, smt } from 'circomlibjs'
import { useAccount } from 'wagmi'
import useEvent from 'react-use-event-hook'
import { useContractAccount, useIsMounted, useServiceClient } from '@accountjs/connect'
import { PrivateRecoveryAccount__factory } from '@accountjs/sdk/dist/types'

import { inter } from '@/lib/css'
import { UserAccount } from '@/components/UserAccount'
import { LOCAL_CONFIG } from '@/config'
import { useUserBalances } from '@/hooks/useBalances'
import { useRouter } from 'next/router'
import { Button } from '@geist-ui/core'

const generateKeyPair = () => {
  const privateKey = genPrivKey().toString()
  const publicKey = eddsa.prv2pub(privateKey) as [BigInt, BigInt]
  return {
    privateKey,
    publicKey
  }
}

const { guardianVerifier, socialRecoveryVerifier, poseidon } = LOCAL_CONFIG

export default function Home() {
  const [keyPairList, setKeyPairList] = useState<{ privateKey: string; publicKey: BigInt[] }[]>([])
  const { address: ownerAddress } = useAccount()
  const router = useRouter()
  const { account: accountAddress } = router.query as { account?: string }

  const account = useContractAccount(accountAddress)
  const serviceClient = useServiceClient()
  const { updateBalances } = useUserBalances(account?.getAddress())
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        console.log(
          '🚀 ~ file: index.tsx:40 ~ await account?.getGuardians():',
          await account?.getGuardians().then((xs) => xs.map((x) => x.toString()))
        )
      } catch (error) {
        console.log('🚀 ~ file: index.tsx:48 ~ ; ~ error:', error)
      }
    })()
  }, [account])

  const handleSetupGuardians = useEvent(async (guardians: BigInt[]) => {
    if (!account || !serviceClient || !ownerAddress) {
      return
    }

    if (!guardians.length) {
      throw new Error('Invalid pubkey')
    }

    setIsInitializing(true)
    try {
      const threshold = Math.floor(guardians.length / 2) + 1
      const tree = await smt.newMemEmptyTrie()
      const lowercasedOwnerAddress = ownerAddress.toLowerCase()
      await tree.insert(0, lowercasedOwnerAddress)
      // Insert tree numerically
      await Promise.all(guardians.map((guard, i) => tree.insert(i + 1, guard)))

      const initializeGuardiansOp = await account.createSignedUserOp({
        target: account.getAddress(),
        data: PrivateRecoveryAccount__factory.createInterface().encodeFunctionData(
          'initilizeGuardians',
          [
            // BigInt is available
            guardians as unknown as string[],
            threshold,
            tree.root,
            guardianVerifier,
            socialRecoveryVerifier,
            poseidon
          ]
        )
      })

      const transactionResponse = await serviceClient.sendUserOp(initializeGuardiansOp)
      await transactionResponse.wait()
      await updateBalances()
    } catch (error) {
      console.log('🚀 ~ file: index.tsx:50 ~ handleSetupGuardians ~ error:', error)
    }
    setIsInitializing(false)
  })

  const initializeGuardians = useEvent(async () => {
    const keyPairA = generateKeyPair()
    const keyPairB = generateKeyPair()
    const keyPairC = generateKeyPair()
    setKeyPairList([keyPairA, keyPairB, keyPairC])

    await handleSetupGuardians([
      keyPairA.publicKey[0] as bigint,
      keyPairB.publicKey[0] as bigint,
      keyPairC.publicKey[0] as bigint
    ])
  })

  const isMounted = useIsMounted()
  if (!isMounted) {
    return null
  }

  return (
    <>
      <Head>
        <title>account.js Demo with private recovery</title>
        <meta name="description" content="account.js example" />
        <meta property="og:title" content="account.js example" key="title" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={cx('p-24 min-h-screen text-xl')}>
        <div className="space-y-6">
          <h1 className={cx('text-5xl font-extrabold capitalize', inter.className)}>
            account.js demo with private recovery
          </h1>

          <UserAccount customAccount={accountAddress} />

          <div className="flex flex-col gap-2">
            <Button onClick={initializeGuardians} disabled={isInitializing}>
              Initialize Guardians
            </Button>

            {!!keyPairList.length && (
              <ul
                role="list"
                className="marker:text-sky-400 list-disc pl-5 space-y-3 text-slate-500"
              >
                {keyPairList.map(({ privateKey, publicKey }) => (
                  <li key={publicKey[0].toString()}>
                    <p>Prv: {privateKey}</p>
                    <p>Pub: {publicKey[0].toString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
