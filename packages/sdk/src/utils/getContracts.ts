import {
  SimpleAccountFactory,
  SimpleAccountFactory__factory,
  SimpleAccount,
  SimpleAccount__factory,
  EntryPoint,
  EntryPoint__factory
} from '@account-abstraction/contracts'
import { ethers } from 'ethers'
import { ContractNetworkConfig } from '../types'

export interface BaseGetContractProps {
  provider: ethers.providers.Provider
  chainId: number
  contractNetwork?: ContractNetworkConfig
}

export interface GetAccountContractProps extends BaseGetContractProps {
  address: string
}

export const ACCOUNT_FACTORY_ADDRESS = '0x7192244743491fcb3f8f682d57ab6e9e1f41de6e'
export async function getAccountFactoryContract({
  provider,
  contractNetwork
}: BaseGetContractProps): Promise<SimpleAccountFactory> {
  return SimpleAccountFactory__factory.connect(
    contractNetwork?.accountFactoryAddress ?? ACCOUNT_FACTORY_ADDRESS,
    provider
  )
}

export async function getAccountContract({
  provider,
  address
}: GetAccountContractProps): Promise<SimpleAccount> {
  return SimpleAccount__factory.connect(address, provider)
}

const ENTRY_POINT_ADDRESS = '0x0576a174D229E3cFA37253523E645A78A0C91B57'
export async function getEntryPointContract({
  provider,
  contractNetwork
}: BaseGetContractProps): Promise<EntryPoint> {
  return EntryPoint__factory.connect(
    contractNetwork?.entryPointAddress ?? ENTRY_POINT_ADDRESS,
    provider
  )
}
