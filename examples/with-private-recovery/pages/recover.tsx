import React from 'react'
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { useContractAccount } from '@accountjs/connect'
import { PrivateRecoveryAccount__factory } from '@accountjs/sdk/dist/types'

const Recover = () => {
  const { address: newOwner } = useAccount()
  const account = useContractAccount()
  const args = []
  const { config } = usePrepareContractWrite({
    address: account?.getAddress(),
    abi: PrivateRecoveryAccount__factory.abi,
    functionName: 'recover',
    args: []
  })
  const { data, isLoading, isSuccess, write } = useContractWrite(config)

  return <div></div>
}

export default Recover
