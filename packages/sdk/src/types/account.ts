import type { ethers, BigNumberish } from 'ethers'
import type { ContractConfig } from './contract'
import { Paymaster } from '../paymaster'

// export interface PaymasterConfig {
//   paymaster: Paymaster
// }

export interface AccountInitConfig {
  signer: ethers.Signer
  salt?: string
  accountAddress?: string
  customContracts?: ContractConfig
  paymaster?: Paymaster
}

export interface CreateAccountConfig {
  signer: ethers.Signer
  salt?: string
  accountAddress?: string
  customContracts?: ContractConfig
  paymaster?: Paymaster
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
