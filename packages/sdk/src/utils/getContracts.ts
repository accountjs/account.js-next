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
import { DEPLOYMENTS } from '../constants'
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
  chainId,
  customContracts
}: BaseGetContractProps): Promise<SimpleAccountFactory> {
  const contractAddress =
    customContracts?.accountFactoryAddress ?? DEPLOYMENTS.accountFactory.networkAddresses[chainId]
  if (!contractAddress) {
    throw new Error('Invalid Account Factory contract address')
  }
  return SimpleAccountFactory__factory.connect(contractAddress, signerOrProvider)
}

export async function getAccountContract({
  signerOrProvider,
  address
}: GetAccountContractProps): Promise<SimpleAccount> {
  return SimpleAccount__factory.connect(address, signerOrProvider)
}

export async function getEntryPointContract({
  signerOrProvider,
  chainId,
  customContracts
}: BaseGetContractProps): Promise<EntryPoint> {
  const contractAddress =
    customContracts?.entryPointAddress ?? DEPLOYMENTS.entryPoint.networkAddresses[chainId]
  if (!contractAddress) {
    throw new Error('Invalid Account Factory contract address')
  }
  return EntryPoint__factory.connect(contractAddress, signerOrProvider)
}
