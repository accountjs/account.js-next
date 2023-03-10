import type { ethers, BigNumberish } from 'ethers'

export type PromiseOrValue<T> = T | Promise<T>

// reverse "Deferrable" or "PromiseOrValue" fields
export type NotPromise<T> = {
  [P in keyof T]: Exclude<T[P], Promise<T[P]>>
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Address = `0x${string}`

export interface ContractConfig {
  accountFactoryAddress: string
  entryPointAddress: string
}

export interface PaymasterConfig {
  address: Address
  tokenAddress: Address
}

export interface AccountInitConfig {
  signer: ethers.Signer
  salt?: string
  accountAddress?: Address
  customContracts?: ContractConfig
  paymasterConfig?: PaymasterConfig
}

export interface CreateAccountConfig {
  signer: ethers.Signer
  salt?: string
  accountAddress?: Address
  customContracts?: ContractConfig
  paymasterConfig?: PaymasterConfig
}

export interface TransactionDetailsForUserOp {
  target: string
  data: string
  value?: BigNumberish
  gasLimit?: BigNumberish
  maxFeePerGas?: BigNumberish
  maxPriorityFeePerGas?: BigNumberish
}

export type ExecCallRequest = {
  to: string
  data: string
  value?: BigNumberish
}

export interface TransactionOptions {
  value?: BigNumberish
  gas?: BigNumberish
  gasLimit?: BigNumberish
  maxFeePerGas?: BigNumberish
  maxPriorityFeePerGas?: BigNumberish
}
