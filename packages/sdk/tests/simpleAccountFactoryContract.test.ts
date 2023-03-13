import { deployments, ethers } from 'hardhat'
import { expect } from 'chai'
import { defaultAbiCoder } from 'ethers/lib/utils'
import { TestAccountFactory__factory, Account__factory } from '../types'
import { getEntryPoint } from './utils/setupContracts'

describe('TestAccountFactory Contract', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await ethers.provider.listAccounts()
    const signer = ethers.provider.getSigner()

    const entryPoint = (await getEntryPoint()).contract
    const testAccountFactory = await new TestAccountFactory__factory(signer).deploy(
      entryPoint.address
    )
    return { accounts, signer, entryPoint, testAccountFactory: testAccountFactory }
  })

  it('should compute the same create2 address', async () => {
    const { signer, testAccountFactory } = await setupTests()

    // Initial config
    const signerAddress = await signer.getAddress()
    const salt = ethers.utils.id('123')

    // Salt
    const bytes32Salt = ethers.utils.solidityPack(['uint256'], [salt])
    const expectedSalt = await testAccountFactory.getBytes32Salt(salt)
    expect(bytes32Salt).to.be.deep.equals(expectedSalt, 'Salt should be equal')

    // Init data
    const implementation = await testAccountFactory.accountImplementation()
    const encodedInitData = defaultAbiCoder.encode(
      ['address', 'bytes'],
      [
        implementation,
        Account__factory.createInterface().encodeFunctionData('initialize', [signerAddress])
      ]
    )
    const expectedEncodedInitData = await testAccountFactory.getInitSig(signerAddress)
    expect(encodedInitData).to.be.deep.equals(expectedEncodedInitData, 'Init data should be equal')

    // Deployment data
    const creationCode = await testAccountFactory.getCreationCode()
    const deploymentCode = ethers.utils.solidityPack(
      ['bytes', 'bytes'],
      [creationCode, encodedInitData]
    )
    const expectedDeploymentCode = await testAccountFactory.getDeploymentData(signerAddress)
    expect(deploymentCode).to.be.deep.equals(
      expectedDeploymentCode,
      'deploymentCode should be equal'
    )

    // Keccaked deployment data
    const keccak256DeploymentCode = ethers.utils.keccak256(deploymentCode)
    const expectedKeccak256DeploymentCode = await testAccountFactory.getDeploymentDataSig(
      signerAddress
    )
    expect(keccak256DeploymentCode).to.be.deep.equals(
      expectedKeccak256DeploymentCode,
      'keccak256DeploymentCode should be equal'
    )

    // Compare create2 address
    const factoryAddress = testAccountFactory.address
    const accountAddress = ethers.utils.getCreate2Address(
      factoryAddress,
      bytes32Salt,
      keccak256DeploymentCode
    )
    const expectedAccountAddress = await testAccountFactory.getAddress(signerAddress, salt)
    expect(accountAddress).to.be.deep.equals(expectedAccountAddress)
  })
})
