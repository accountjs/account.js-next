import { deployments, ethers } from 'hardhat'
import type { AbiItem } from 'web3-utils'
import { accountFactoryDeployed, entryPointDeployed } from '../../hardhat/deploy/deploy-contracts'
import type { AccountFactory, EntryPoint } from '../../types'
import { rethrow } from './error'

export const getAccountFactory = async (): Promise<{
  contract: AccountFactory
  abi: AbiItem | AbiItem[]
}> => {
  const AccountDeployment = await deployments.get(accountFactoryDeployed.name)
  const AccountFactory = await ethers.getContractFactory(accountFactoryDeployed.name)

  return {
    contract: AccountFactory.attach(AccountDeployment.address) as AccountFactory,
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
    contract: Object.assign(contract, {
      // Rewrite handleOps with custom error throw
      handleOps(...args: Parameters<EntryPoint['handleOps']>) {
        return contract.handleOps(...args).catch(rethrow())
      }
    }),
    abi: EntryPointDeployment.abi
  }
}
