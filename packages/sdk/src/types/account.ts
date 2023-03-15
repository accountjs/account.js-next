import type { ethers, BigNumberish } from 'ethers'
import type { ContractConfig } from './contract'

export interface PaymasterConfig {
  address: string
  tokenAddress: string
}

export interface AccountInitConfig {
  signer: ethers.Signer
  salt?: string
  accountAddress?: string
  customContracts?: ContractConfig
  paymasterConfig?: PaymasterConfig
}

export interface CreateAccountConfig {
  signer: ethers.Signer
  salt?: string
  accountAddress?: string
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
