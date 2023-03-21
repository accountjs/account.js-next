import { id } from 'ethers/lib/utils'
import ENTRY_POINT from './assets/entry_point.json'
import ACCOUNT_FACTORY from './assets/account_factory.json'

export interface SingletonDeployment {
  defaultAddress: string
  version: string
  abi: any[]
  networkAddresses: Record<string, string>
  contractName: string
  released: boolean
}

type contractKeys = 'entryPoint' | 'accountFactory'

export const DEPLOYMENTS: Record<contractKeys, SingletonDeployment> = {
  entryPoint: ENTRY_POINT,
  accountFactory: ACCOUNT_FACTORY
}

// Used when user create new wallet without salt
export const ACCOUNTJS_CONSTANT_SALT = id('Account.js Account Abstraction')
