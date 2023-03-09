import { deployments, ethers } from 'hardhat'
import { EntryPoint__factory, SimpleAccountFactory__factory } from '@account-abstraction/contracts'
import { expect } from 'chai'
import { TestToken__factory } from '../typechain/factories/contracts/tests/TestToken__factory'
import { CheckBalance__factory } from '../typechain/factories/contracts/tests/CheckBalance__factory'
import { Account } from '../src'
import { calculateAccountAddress } from '../src/utils/address'

it('calculateAccountAddress compute the same address as entryPoint createSender result', async () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await ethers.provider.listAccounts()
    const signer = await ethers.provider.getSigner()
    const entryPoint = await new EntryPoint__factory(signer).deploy()
    const simpleAccountFactory = await new SimpleAccountFactory__factory(signer).deploy(
      entryPoint.address
    )
    const testToken = await new TestToken__factory(signer).deploy()
    const checkBalance = await new CheckBalance__factory(signer).deploy()
    const implementation = await simpleAccountFactory.accountImplementation()
    return {
      accounts,
      signer,
      testToken,
      implementation,
      simpleAccountFactory,
      checkBalance,
      entryPoint
    }
  })

  const { signer, entryPoint, simpleAccountFactory } = await setupTests()
  const salt = '000000'
  const account = Account.create({
    signer,
    salt,
    contractNetwork: {
      accountFactoryAddress: simpleAccountFactory.address,
      entryPointAddress: entryPoint.address
    }
  })

  const calculatedAddress = await calculateAccountAddress(simpleAccountFactory, salt, signer)
  expect(calculatedAddress).to.be.eq((await account).address)
})
