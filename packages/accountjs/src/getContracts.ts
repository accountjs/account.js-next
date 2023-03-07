import {
  SimpleAccountFactory,
  SimpleAccountFactory__factory,
  SimpleAccount,
  SimpleAccount__factory,
  EntryPoint,
  EntryPoint__factory
} from '@account-abstraction/contracts'
import { ethers } from 'ethers'
import { Address } from './types'

export interface BaseGetContractProps {
  provider: ethers.providers.Provider
  chainId: number
}

export interface GetAccountContractProps extends BaseGetContractProps {
  address: Address
}

// TODO: Add address map instead of hardcoded address
const ACCOUNT_FACTORY_ADDRESS = '0x7192244743491fcb3f8f682d57ab6e9e1f41de6e'
export async function getFactoryContract({
  provider
}: BaseGetContractProps): Promise<SimpleAccountFactory> {
  return SimpleAccountFactory__factory.connect(ACCOUNT_FACTORY_ADDRESS, provider)
}

export async function getAccountContract({
  provider,
  address
}: GetAccountContractProps): Promise<SimpleAccount> {
  return SimpleAccount__factory.connect(address, provider)
}

// TODO: Add address map instead of hardcoded address
const ENTRY_POINT_ADDRESS = '0x0576a174D229E3cFA37253523E645A78A0C91B57'
export async function getEntryPointContract({
  provider
}: BaseGetContractProps): Promise<EntryPoint> {
  return EntryPoint__factory.connect(ENTRY_POINT_ADDRESS, provider)
}
