import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import useEvent from 'react-use-event-hook'
import cx from 'clsx'
import { inter } from '@/lib/css'
import { Address, useAccount, useConnect, useContractRead, useDisconnect, useProvider } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
// @ts-expect-error no typings for circomlibjs
import { eddsa, poseidon } from 'circomlibjs'
import { Account__factory } from '@accountjs/sdk/dist/types'
import { Button, Text, useToasts } from '@geist-ui/core'
import { useIsMounted } from '@/hooks/useIsMounted'
import Link from 'next/link'
import Image from 'next/image'
import Logo from '../public/private_guardian_logo.png'

const Recover = () => {
  const router = useRouter()
  const { account } = router.query as { account?: string }

  const [privateKey, setPrivateKey] = useState<string>()
  const [isRecovering, setIsRecovering] = useState(false)

  const { data: oldOwner, refetch } = useContractRead({
    address: account as Address,
    abi: Account__factory.abi,
    functionName: 'owner'
  })

  const { address: newOwner, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector()
  })
  const { disconnect } = useDisconnect()

  const hasNoAccount = !account
  const hasNoOwner = !oldOwner || !newOwner
  const isSameOwner = oldOwner === newOwner
  const disabledRecover = hasNoOwner || hasNoAccount || isSameOwner || isRecovering

  const warningMessageNode = (
    <Text h5 className="capitalize" type="error">
      {hasNoAccount
        ? 'No account provided, Please open this from recovery external link. '
        : isSameOwner
        ? 'You are now the owner of this account'
        : hasNoOwner
        ? 'This contract account has not been deployed yet'
        : null}
    </Text>
  )

  const { setToast } = useToasts()

  const handleRecover = useEvent(async () => {
    if (hasNoOwner) {
      return setToast({ text: 'No wallet connected, please connect it first', type: 'error' })
    }

    const hashOfNewOwner = poseidon([newOwner])
    const signatures = eddsa.signMiMC(privateKey, hashOfNewOwner)
    const signature = [signatures.S, signatures.R8[0], signatures.R8[1]].toString()
    const publicKey = eddsa.prv2pub(privateKey).toString()
    const data = { oldOwner, account, newOwner, signature, publicKey, privateKey }

    try {
      setIsRecovering(true)
      const response = await fetch('/api/recover', {
        method: 'post',
        body: JSON.stringify(data)
      })
      const json = await response.json()
      if (response.status !== 200) {
        throw json.error.message
      }
      setToast({ text: `Vote recover with ${account} success`, type: 'success' })
      const { data: owner } = await refetch()
      if (owner === newOwner) {
        setToast({ text: `Account has been recover to ${newOwner}!`, type: 'success' })
        setPrivateKey(undefined)
      }
    } catch (errorMsg) {
      setToast({ text: errorMsg as string, type: 'error' })
    }
    setIsRecovering(false)
  })

  // If current owner is the same
  const isMounted = useIsMounted()
  if (!isMounted) {
    return null
  }

  return (
    <>
      <Head>
        <title>Private Guardian - Social Recovery</title>
        <meta name="description" content="Private Guardian - Social Recovery" />
        <meta property="og:title" content="Private Guardian - Social Recovery" key="title" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={cx('p-24 text-xl')}>
        <div className="space-y-6">
          <Link href={account ? `/?account=${account}` : '/'}>
            <div className="flex items-end gap-4">
              <Image src={Logo.src} height={60} width={60} alt="Private guardian logo" />
              <h1 className={cx('text-5xl font-extrabold capitalize m-0', inter.className)}>
                Private Guardian
              </h1>
            </div>
          </Link>

          <h2 className={cx('text-3xl font-extrabold capitalize', inter.className)}>
            Social Recovery
          </h2>
          {isConnected ? (
            <Button
              className="acck-capitalize acck-inline-flex acck-items-center acck-rounded-md acck-border acck-border-transparent acck-bg-pink-600 acck-px-2 acck-py-2 acck-text-sm acck-font-medium acck-leading-4 acck-text-white acck-shadow-sm hover:acck-bg-pink-700 focus:acck-outline-none focus:acck-ring-2 focus:acck-ring-pink-500 focus:acck-ring-offset-2"
              onClick={() => disconnect()}
            >
              Disconnect
            </Button>
          ) : (
            <Button onClick={() => connect()}>Connect Wallet</Button>
          )}

          <div className="">
            <div className="flex gap-4 items-center">
              <strong className="capitalize">
                You are trying to recover SCW Account Address:{' '}
              </strong>
              <Text p className="m-0">
                {account ?? '-'}
              </Text>
            </div>

            <div className="flex gap-4 items-center">
              <strong className="capitalize">The old owner is:</strong>
              <Text p className="m-0">
                {oldOwner ?? '-'}
              </Text>
            </div>

            <div className="flex gap-4 items-center">
              <strong className="capitalize">You are trying to recover to:</strong>
              <Text p className="m-0">
                {newOwner ?? '-'}
              </Text>
            </div>

            <div className="relative mt-4">
              <label
                htmlFor="privateKey"
                className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900"
              >
                ZK PrivateKey
              </label>
              <input
                type="text"
                name="privateKey"
                id="privateKey"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="..."
                value={privateKey}
                onChange={(ev) => setPrivateKey(ev.target.value)}
                disabled={disabledRecover}
              />
              {warningMessageNode}
            </div>
            <Button
              className="rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-75"
              disabled={disabledRecover}
              onClick={handleRecover}
              ghost
              type="secondary"
              loading={isRecovering}
            >
              Recover
            </Button>
          </div>
        </div>

        <footer className="py-12 text-lg capitalize font-semibold">
          backed by{' '}
          <a href="https://github.com/accountjs/account.js-next" target="_blank" rel="noreferrer">
            accountjs SDK
          </a>
        </footer>
      </main>
    </>
  )
}

export default Recover
