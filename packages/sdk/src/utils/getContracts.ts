import type { ethers } from 'ethers'
import type { ContractConfig } from '../types'
import { CONTRACTS } from '../constants'
import type { EntryPoint, Account, AccountFactory } from '../../types'
import { EntryPoint__factory, Account__factory, AccountFactory__factory } from '../../types'

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
}: BaseGetContractProps): Promise<AccountFactory> {
  return AccountFactory__factory.connect(
    customContracts?.accountFactoryAddress ?? CONTRACTS.accountFactoryAddress,
    signerOrProvider
  )
}

export async function getAccountContract({
  signerOrProvider,
  address
}: GetAccountContractProps): Promise<Account> {
  return Account__factory.connect(address, signerOrProvider)
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
