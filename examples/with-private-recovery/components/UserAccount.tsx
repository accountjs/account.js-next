import React from 'react'
import useEvent from 'react-use-event-hook'
import { Address, erc20ABI } from 'wagmi'
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

const { usdt, weth, tokenAddr: fixedToken } = LOCAL_CONFIG

const TOKEN_ADDRESS_MAP = {
  [Currency.usdt]: usdt,
  [Currency.weth]: weth,
  [Currency.token]: fixedToken
}

export const UserAccount = () => {
  const account = useContractAccount()
  const serviceClient = useServiceClient()
  const { balances, updateBalances } = useUserBalances(account?.getAddress())

  const transfer = useEvent(async (currency: Currency, target: string, amount: string) => {
    if (!serviceClient || !account || !balances) {
      return
    }
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
    await serviceClient.sendUserOp(op)
    await updateBalances()
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
        <ConnectButton />
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
