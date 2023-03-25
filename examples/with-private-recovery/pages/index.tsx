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

const generatePubKey = () => {
  const privateKey = genPrivKey().toString()
  const publicKey = eddsa.prv2pub(privateKey) as [BigInt, BigInt]
  return {
    privateKey,
    publicKey
  }
}

const { guardianVerifier, socialRecoveryVerifier, poseidon } = LOCAL_CONFIG

export default function Home() {
  const [pubKeyList, setPubKeyList] = useState<BigInt[]>([])
  const [pubKeyTextValue, setPubKeyTextValue] = useState<string>()
  const { address: ownerAddress } = useAccount()
  const account = useContractAccount()
  const serviceClient = useServiceClient()
  const { updateBalances } = useUserBalances(account?.getAddress())

  const handleSetupGuardians = useEvent(async () => {
    if (!pubKeyTextValue || !account || !serviceClient || !ownerAddress) {
      return
    }

    //
    const guardians = pubKeyTextValue
      .trim()
      .split('\n')
      .filter((x) => !!x)
    if (!guardians.length) {
      throw new Error('Invalid pubkey')
    }
    //
    const flooredLenth = Math.floor(guardians.length / 2)
    const threshold = flooredLenth === 0 ? 1 : flooredLenth

    const tree = await smt.newMemEmptyTrie()
    await tree.insert(0, ownerAddress)
    // Insert tree numerically
    await Promise.all(guardians.map((guard, i) => tree.insert(i + 1, guard)))

    const initializeGuardiansOp = await account.createSignedUserOp({
      target: account.getAddress(),
      data: PrivateRecoveryAccount__factory.createInterface().encodeFunctionData(
        'initilizeGuardians',
        [guardians, threshold, tree.root, guardianVerifier, socialRecoveryVerifier, poseidon]
      )
    })

    const transactionResponse = await serviceClient.sendUserOp(initializeGuardiansOp)
    await transactionResponse.wait()
    await updateBalances()
    console.log('🚀 ~ file: index.tsx:61 ~ handleSetupGuardians ~ response:', transactionResponse)
  })

  const handleGeneratePublicKey = useEvent(() => {
    // Store
    const { publicKey } = generatePubKey()
    const publicData = publicKey[0]
    setPubKeyList((xs) => [...xs, publicData])
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

          <button onClick={handleGeneratePublicKey}>Generate public keys</button>
          {!!pubKeyList.length && (
            <ul>
              {pubKeyList.map((k) => (
                <li>{k.toString()}</li>
              ))}
            </ul>
          )}

          <textarea
            value={pubKeyTextValue}
            onChange={(ev) => setPubKeyTextValue(ev.target.value)}
          />
          <button onClick={handleSetupGuardians}>Setup guardians</button>
        </div>
      </main>
    </>
  )
}
