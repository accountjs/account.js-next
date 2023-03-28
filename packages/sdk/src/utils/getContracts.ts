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
import type { PrivateRecoveryAccount } from '../../types'
import { PrivateRecoveryAccount__factory } from '../../types'

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
    throw new Error('Invalid AccountFactory contract address')
  }
  return SimpleAccountFactory__factory.connect(contractAddress, signerOrProvider)
}

export function getAccountContract({
  signerOrProvider,
  address
}: GetAccountContractProps): SimpleAccount {
  return SimpleAccount__factory.connect(address, signerOrProvider)
}

export function getPrivateRecoveryAccountContract({
  signerOrProvider,
  address
}: GetAccountContractProps): PrivateRecoveryAccount {
  return PrivateRecoveryAccount__factory.connect(address, signerOrProvider)
}

export function getEntryPointContract({
  signerOrProvider,
  chainId,
  customContracts
}: BaseGetContractProps): EntryPoint {
  const contractAddress =
    customContracts?.entryPointAddress ?? DEPLOYMENTS.entryPoint.networkAddresses[chainId]
  if (!contractAddress) {
    throw new Error('Invalid EntryPoint contract address')
  }
  return EntryPoint__factory.connect(contractAddress, signerOrProvider)
}
