import type { DeployFunction } from 'hardhat-deploy/types'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'

export const entryPointDeployed = { name: 'EntryPoint' }
export const accountFactoryDeployed = { name: 'AccountFactory' }

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
}

export default deploy
