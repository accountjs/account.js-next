import React from 'react'
import useEvent from 'react-use-event-hook'
import { Address, erc20ABI, useAccount, useConnect, useDisconnect } from 'wagmi'
import { getContract } from 'wagmi/actions'
import { parseEther, parseUnits } from 'ethers/lib/utils.js'
import cx from 'clsx'
import { ConnectButton, useContractAccount, useServiceClient } from '@accountjs/connect'
import { Currency } from '@/lib/type'
import { inter } from '@/lib/css'
import { useUserBalances } from '@/hooks/useBalances'
import { faucet } from '@/lib/helper'
import { LOCAL_CONFIG } from '@/config'
import { TransferProps, Transfer } from './Transfer'
import { UserBalances } from './UserBalances'
import { Button } from '@geist-ui/core'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { useIsMounted } from '@/hooks/useIsMounted'

const { usdt, weth, tokenAddr: fixedToken } = LOCAL_CONFIG

const TOKEN_ADDRESS_MAP = {
  [Currency.usdt]: usdt,
  [Currency.weth]: weth,
  [Currency.token]: fixedToken
}

export const UserAccount = ({ customAccount }: { customAccount?: string }) => {
  const account = useContractAccount(customAccount)
  const serviceClient = useServiceClient()
  const { balances, updateBalances } = useUserBalances(account?.getAddress())
  const { connect } = useConnect({
    connector: new InjectedConnector()
  })
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const transfer = useEvent(async (currency: Currency, target: string, amount: string) => {
    if (!serviceClient || !account || !balances) {
      return
    }
    try {
      if (currency === Currency.ether) {
        const op = await account.createSignedUserOp({
          target,
          data: '0x',
          value: parseEther(amount)
        })
        return serviceClient.sendUserOp(op)
      }

      const token = balances[currency]
      const tokenAddress = TOKEN_ADDRESS_MAP[currency]
      const contract = getContract({ address: tokenAddress, abi: erc20ABI })
      const decimals = await (token?.decimals ?? contract.decimals())
      const data = contract.interface.encodeFunctionData('transfer', [
        target,
        parseUnits(amount, decimals)
      ])
      const op = await account.createSignedUserOp({
        data,
        target: tokenAddress
      })
      const transactionResponse = await serviceClient.sendUserOp(op)
      await transactionResponse.wait()
      await updateBalances()
    } catch (error) {
      console.log("🚀 ~ file: UserAccount.tsx:67 ~ transfer ~ error:", error)
    }
  })

  const handleTransfer: TransferProps['handleTransfer'] = async (
    { target, amount, currency },
    { setSubmitting }
  ) => {
    if (!amount) {
      return
    }
    setSubmitting(true)
    await transfer(currency, target as Address, amount)
    await updateBalances()
    setSubmitting(false)
  }

  const hasDeployed = true
  const hasAnyBalances =
    balances && Object.values(balances).some((balance) => !!balance && balance.value.gt(0))

  const handleFaucetClick = async (token: Currency) => {
    if (!account) {
      return
    }

    await faucet(account.getAddress(), token)
    await updateBalances()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className={cx('text-3xl font-extrabold capitalize', inter.className)}>Account State</h2>
        <ConnectButton customAccount={customAccount} />
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
      </div>
      {/* Balances */}
      {/* Demonstrate sponsor and transfer using swc api */}
      <div className="space-y-1">
        <h2 className={cx('text-3xl font-extrabold', inter.className)}>Balances</h2>
        {!!account && <UserBalances balances={balances} handleFaucetClick={handleFaucetClick} />}
      </div>
      {hasDeployed && hasAnyBalances && <Transfer handleTransfer={handleTransfer} />}
    </div>
  )
}
