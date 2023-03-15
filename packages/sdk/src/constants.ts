import { id } from 'ethers/lib/utils'
import type { ContractConfig } from './types/contract'

// TODO: They are hardhat addresses only, update them to specific chain addresses
export const CONTRACTS: ContractConfig = {
  accountFactoryAddress: '0x815e8E414447951db9D499AD243D68DB2120e4A0',
  entryPointAddress: '0xf66af1a6Ebda9511201d1E0BcD4f3358D7299AD6'
}

// Used when user create new wallet without salt
export const ACCOUNTJS_CONSTANT_SALT = id('Account.js Account Abstraction')
