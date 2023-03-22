import { LOCAL_CONFIG } from '@/config'
import { getDefaultProvider, Wallet } from 'ethers'
import { providers } from 'ethers/lib'

const { mnemonic, providerUrl } = LOCAL_CONFIG

export const provider = getDefaultProvider(providerUrl) as providers.JsonRpcProvider
export const admin = Wallet.fromMnemonic(mnemonic).connect(provider)
