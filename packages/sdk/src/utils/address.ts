import { ethers } from 'ethers'
import { defaultAbiCoder } from 'ethers/lib/utils'
import type {
  EntryPoint,
  SimpleAccountFactory as SimpleAccountFactoryContract
} from '@account-abstraction/contracts'
import { SimpleAccount__factory } from '@account-abstraction/contracts'
import { bytecode as ERC1967ProxyCreationCode } from '@openzeppelin/contracts/build/contracts/ERC1967Proxy.json'
import type { Address } from '../types/helpers'

async function getAccountCreate2Elements(
  accountFactoryContract: SimpleAccountFactoryContract,
  salt: string,
  signerAddress: string
) {
  const factoryAddress = accountFactoryContract.address
  const implementation = await accountFactoryContract.accountImplementation()

  const bytes32Salt = ethers.utils.solidityPack(['uint256'], [salt])
  const initData = defaultAbiCoder.encode(
    ['address', 'bytes'],
    [
      implementation,
      SimpleAccount__factory.createInterface().encodeFunctionData('initialize', [signerAddress])
    ]
  )
  const deploymentCode = ethers.utils.solidityPack(
    ['bytes', 'bytes'],
    [ERC1967ProxyCreationCode, initData]
  )
  const keccak256DeploymentCode = ethers.utils.keccak256(deploymentCode)

  return {
    bytes32Salt,
    factoryAddress,
    keccak256DeploymentCode
  }
}

export async function calculateAccountAddress(
  accountFactoryContract: SimpleAccountFactoryContract,
  salt: string,
  signerAddress: string
): Promise<Address> {
  const { bytes32Salt, factoryAddress, keccak256DeploymentCode } = await getAccountCreate2Elements(
    accountFactoryContract,
    salt,
    signerAddress
  )

  const derivedAddress = ethers.utils.getCreate2Address(
    factoryAddress,
    bytes32Salt,
    keccak256DeploymentCode
  )
  return derivedAddress as Address
}

/**
 * calculate the account address even before it is deployed
 */
export async function getCounterFactualAddress(
  initCode: string,
  entryPointView: EntryPoint
): Promise<string> {
  // use entryPoint to query account address (factory can provide a helper method to do the same, but
  // this method attempts to be generic
  try {
    await entryPointView.callStatic.getSenderAddress(initCode)
  } catch (e: any) {
    return e.errorArgs.sender
  }
  throw new Error('must handle revert')
}
