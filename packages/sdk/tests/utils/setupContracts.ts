import { deployments, ethers } from 'hardhat'
import type { AbiItem } from 'web3-utils'
import type { SimpleAccountFactory, EntryPoint } from '@account-abstraction/contracts'
import { accountFactoryDeployed, entryPointDeployed } from '../../hardhat/deploy/deploy-contracts'
import { rethrow } from './error'

export const getAccountFactory = async (): Promise<{
  contract: SimpleAccountFactory
  abi: AbiItem | AbiItem[]
}> => {
  const AccountDeployment = await deployments.get(accountFactoryDeployed.name)
  const SimpleAccountFactory = await ethers.getContractFactory(accountFactoryDeployed.name)

  return {
    contract: SimpleAccountFactory.attach(AccountDeployment.address) as SimpleAccountFactory,
    abi: AccountDeployment.abi
  }
}

export const getEntryPoint = async (): Promise<{
  contract: EntryPoint
  abi: AbiItem | AbiItem[]
}> => {
  const EntryPointDeployment = await deployments.get(entryPointDeployed.name)
  const EntryPointFactory = await ethers.getContractFactory(entryPointDeployed.name)

  const contract = EntryPointFactory.attach(EntryPointDeployment.address) as EntryPoint

  return {
    contract: {
      ...contract,
      // Rewrite handleOps with custom error throw
      handleOps(...args: Parameters<EntryPoint['handleOps']>) {
        return contract.handleOps(...args).catch(rethrow())
      }
    } as EntryPoint,
    abi: EntryPointDeployment.abi
  }
}
