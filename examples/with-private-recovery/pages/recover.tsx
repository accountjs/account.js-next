import Head from 'next/head'
import React from 'react'
import cx from 'clsx'
import { UserAccount } from '@/components/UserAccount'
import { inter } from '@/lib/css'

const Recover = () => {
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
        </div>
      </main>
    </>
  )
}

export default Recover
