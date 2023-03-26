import Head from 'next/head'
import cx from 'clsx'
import { useState } from 'react'
import { genPrivKey } from 'maci-crypto'
// @ts-expect-error there is no typing for circomlibjs yet
import { eddsa, smt } from 'circomlibjs'
import { useAccount } from 'wagmi'
import useEvent from 'react-use-event-hook'
import { useContractAccount, useServiceClient } from '@accountjs/connect'
import { PrivateRecoveryAccount__factory } from '@accountjs/sdk/dist/types'

import { inter } from '@/lib/css'
import { UserAccount } from '@/components/UserAccount'
import { LOCAL_CONFIG } from '@/config'
import { useUserBalances } from '@/hooks/useBalances'

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
  const [pubKeyTextValue, setPubKeyTextValue] = useState<string>()
  const { address: ownerAddress } = useAccount()
  const account = useContractAccount()
  const serviceClient = useServiceClient()
  const { updateBalances } = useUserBalances(account?.getAddress())

  const handleSetupGuardians = useEvent(async (guardians: string[][]) => {
    if (!pubKeyTextValue || !account || !serviceClient || !ownerAddress) {
      return
    }

    if (!guardians.length) {
      throw new Error('Invalid pubkey')
    }

    const threshold = Math.floor(guardians.length / 2) + 1
    const tree = await smt.newMemEmptyTrie()
    await tree.insert(0, ownerAddress)
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
  })

  const initializeGuardians = useEvent(() => {
    const keyPairA = generateKeyPair()
    const keyPairB = generateKeyPair()
    const keyPairC = generateKeyPair()
    setKeyPairList((xs) => [...xs, keyPairA, keyPairB, keyPairC])

    handleSetupGuardians([
      keyPairA.publicKey as unknown as string[],
      keyPairB.publicKey as unknown as string[],
      keyPairC.publicKey as unknown as string[]
    ])
  })

  return (
    <>
      <Head>
        <title>account.js Demo</title>
        <meta name="description" content="account.js example" />
        <meta property="og:title" content="account.js example" key="title" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={cx('p-24 min-h-screen text-xl')}>
        <div className="space-y-6">
          <h1 className={cx('text-5xl font-extrabold capitalize', inter.className)}>
            account.js demo
          </h1>

          <UserAccount />

          <div className="flex flex-col gap-2">
            <button onClick={initializeGuardians}>Initialize Guardians</button>
            {!!keyPairList.length && (
              <ul>
                {keyPairList.map(({ privateKey, publicKey }) => (
                  <li>
                    <p>Prv: {privateKey}</p>
                    <p>Pub: {publicKey[0].toString()}</p>
                  </li>
                ))}
              </ul>
            )}
            <textarea
              value={pubKeyTextValue}
              onChange={(ev) => setPubKeyTextValue(ev.target.value)}
              readOnly
            />
          </div>
        </div>
      </main>
    </>
  )
}
