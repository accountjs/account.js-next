import type { DeployFunction } from 'hardhat-deploy/types'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'

export const entryPointDeployed = { name: 'EntryPoint' }
export const accountFactoryDeployed = { name: 'AccountFactory' }
export const privateRecoveryAccountFactoryDeployed = { name: 'PrivateRecoveryAccountFactory' }
export const guardianStorageDeployed = { name: 'GuardianStorage' }

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  const { deployments, getNamedAccounts } = hre
  const { deployer } = await getNamedAccounts()
  const { deploy } = deployments

  const entryPoint = await deploy(entryPointDeployed.name, {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  })

  await deploy(accountFactoryDeployed.name, {
    from: deployer,
    args: [entryPoint.address],
    log: true,
    deterministicDeployment: true
  })

  const guardianStorage = await deploy(guardianStorageDeployed.name, {
    from: deployer,
    log: true,
    deterministicDeployment: true
  })

  await deploy(privateRecoveryAccountFactoryDeployed.name, {
    from: deployer,
    args: [entryPoint.address],
    log: true,
    deterministicDeployment: true,
    libraries: {
      'contracts/GuardianStorage.sol:GuardianStorage': guardianStorage.address
    }
  })
}

export default deploy
