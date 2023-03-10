import type { Signer } from 'ethers'
import { ethers } from 'ethers'
import { defaultAbiCoder } from 'ethers/lib/utils'
import type { AccountFactory as AccountFactoryContract } from '../../types'
import { Account__factory } from '../../types'
import type { Address } from '../types'

async function getAccountCreate2Elements(
  accountFactoryContract: AccountFactoryContract,
  salt: string,
  signer: Signer
) {
  const factoryAddress = accountFactoryContract.address
  const signerAddress = await signer.getAddress()
  const implementation = await accountFactoryContract.accountImplementation()
  const proxyCreationCode = await accountFactoryContract.getCreationCode()

  const bytes32Salt = ethers.utils.solidityPack(['uint256'], [salt])
  const initData = defaultAbiCoder.encode(
    ['address', 'bytes'],
    [
      implementation,
      Account__factory.createInterface().encodeFunctionData('initialize', [signerAddress])
    ]
  )
  const deploymentCode = ethers.utils.solidityPack(
    ['bytes', 'bytes'],
    [proxyCreationCode, initData]
  )
  const keccak256DeploymentCode = ethers.utils.keccak256(deploymentCode)

  return {
    bytes32Salt,
    keccak256DeploymentCode,
    factoryAddress
  }
}

export async function calculateAccountAddress(
  accountFactoryContract: AccountFactoryContract,
  salt: string,
  signer: Signer
): Promise<Address> {
  const { bytes32Salt, factoryAddress, keccak256DeploymentCode } = await getAccountCreate2Elements(
    accountFactoryContract,
    salt,
    signer
  )

  const derivedAddress = ethers.utils.getCreate2Address(
    factoryAddress,
    bytes32Salt,
    keccak256DeploymentCode
  )
  return derivedAddress as Address
}
