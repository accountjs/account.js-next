import type { Provider, TransactionRequest } from '@ethersproject/providers'
import type { BigNumberish } from 'ethers'
import { hexConcat } from 'ethers/lib/utils'
import { Account__factory, AccountFactory__factory } from '../../types'

export const encodeFactoryCreateAccountCode = (
  factoryAddress: string,
  owner: string,
  salt: string
): string => {
  return hexConcat([
    factoryAddress,
    AccountFactory__factory.createInterface().encodeFunctionData('createAccount', [owner, salt])
  ])
}

const accountInterface = Account__factory.createInterface()

export const encodeExecutionTransaction = (
  target: string,
  value: BigNumberish,
  data: string
): string => {
  return accountInterface.encodeFunctionData('execute', [target, value, data])
}

export const encodeBatchExecutionTransaction = (txs: TransactionRequest[]): string => {
  const destinations = txs.map((tx) => tx.to ?? '')
  const callDatas = txs.map((tx) => tx.data ?? '0x00')
  return accountInterface.encodeFunctionData('executeBatch', [destinations, callDatas])
}

export const getPriorityFee = async (
  provider: Provider,
  info: {
    maxFeePerGas?: BigNumberish
    maxPriorityFeePerGas?: BigNumberish
  }
) => {
  let maxFeePerGas = info.maxFeePerGas
  let maxPriorityFeePerGas = info.maxPriorityFeePerGas

  if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
    const feeData = await provider.getFeeData()
    if (maxFeePerGas == null) {
      maxFeePerGas = feeData.maxFeePerGas ?? 0
    }
    if (maxPriorityFeePerGas == null) {
      maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 0
    }
  }

  return { maxFeePerGas, maxPriorityFeePerGas }
}
