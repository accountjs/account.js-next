import { id } from 'ethers/lib/utils'
import type { ContractConfig } from './types/contract'

// TODO: These are local addresses only, update them to specific chain addresses
export const CONTRACTS: ContractConfig = {
  accountFactoryAddress: '0x8bF0813d0618A9a58cab252C8d5C62F1004CB204',
  entryPointAddress: '0xf66af1a6Ebda9511201d1E0BcD4f3358D7299AD6'
}

// Used when user create new wallet without salt
export const ACCOUNTJS_CONSTANT_SALT = id('Account.js Account Abstraction')
