import type { ethers } from 'ethers'
import type {
  EntryPoint,
  SimpleAccount,
  SimpleAccountFactory
} from '@account-abstraction/contracts'
import {
  EntryPoint__factory,
  SimpleAccount__factory,
  SimpleAccountFactory__factory
} from '@account-abstraction/contracts'
import { CONTRACTS } from '../constants'
import type { ContractConfig } from '../types/contract'

export interface BaseGetContractProps {
  signerOrProvider: ethers.Signer | ethers.providers.Provider
  chainId: number
  customContracts?: ContractConfig
}

export interface GetAccountContractProps extends BaseGetContractProps {
  address: string
}

export async function getAccountFactoryContract({
  signerOrProvider,
  customContracts
}: BaseGetContractProps): Promise<SimpleAccountFactory> {
  return SimpleAccountFactory__factory.connect(
    customContracts?.accountFactoryAddress ?? CONTRACTS.accountFactoryAddress,
    signerOrProvider
  )
}

export async function getAccountContract({
  signerOrProvider,
  address
}: GetAccountContractProps): Promise<SimpleAccount> {
  return SimpleAccount__factory.connect(address, signerOrProvider)
}

export async function getEntryPointContract({
  signerOrProvider,
  customContracts
}: BaseGetContractProps): Promise<EntryPoint> {
  return EntryPoint__factory.connect(
    customContracts?.entryPointAddress ?? CONTRACTS.entryPointAddress,
    signerOrProvider
  )
}
