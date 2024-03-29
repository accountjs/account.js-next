import type { ContractConfig } from '../../src/types/contract'
import { getAccountFactory, getEntryPoint } from './setupContracts'

export async function getContractNetwork(): Promise<ContractConfig> {
  return {
    accountFactoryAddress: (await getAccountFactory()).contract.address,
    entryPointAddress: (await getEntryPoint()).contract.address
  }
}
