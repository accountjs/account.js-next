import { deployments, ethers } from 'hardhat'
import { expect } from 'chai'
import { Account } from '../src'
import { calculateAccountAddress } from '../src/utils/address'
import { getContractNetwork } from './utils/setupContractNetwork'
import { getAccountFactory } from './utils/setupContracts'

it('calculateAccountAddress compute the same address as entryPoint createSender result', async () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await ethers.provider.listAccounts()
    const signer = await ethers.provider.getSigner()

    return {
      accounts,
      signer,
      simpleAccountFactory: (await getAccountFactory()).contract,
      customContracts: await getContractNetwork()
    }
  })

  const { signer, customContracts, simpleAccountFactory } = await setupTests()
  const salt = '123'
  const account = await Account.create({
    signer,
    salt,
    customContracts
  })

  const signerAddress = await signer.getAddress()
  const calculatedAddress = await calculateAccountAddress(simpleAccountFactory, salt, signerAddress)
  expect(calculatedAddress).to.be.eq(account.getAddress())
})
