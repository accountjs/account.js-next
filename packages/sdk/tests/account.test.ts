import { deployments, ethers } from 'hardhat'
import { expect } from 'chai'
import { EntryPoint__factory, SimpleAccountFactory__factory } from '@account-abstraction/contracts'
import { Account } from '../src'
import { parseEther } from 'ethers/lib/utils'

describe('Account', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await ethers.provider.listAccounts()
    const signer = await ethers.provider.getSigner()
    const entryPoint = await new EntryPoint__factory(signer).deploy()
    const simpleAccountFactory = await new SimpleAccountFactory__factory(signer).deploy(
      entryPoint.address
    )
    const implementation = await simpleAccountFactory.accountImplementation()
    return { accounts, signer, implementation, simpleAccountFactory, entryPoint }
  })

  it('initialize with account contract address', async () => {
    const { signer, simpleAccountFactory, entryPoint } = await setupTests()
    const account = await Account.create({
      signer,
      contractNetwork: {
        accountFactoryAddress: simpleAccountFactory.address,
        entryPointAddress: entryPoint.address
      }
    })
    expect(await account.getAddress()).to.be.a('string')
  })

  it('owner should be able to call transfer', async () => {
    const { signer, accounts, simpleAccountFactory, entryPoint } = await setupTests()
    const account = await Account.create({
      signer,
      contractNetwork: {
        accountFactoryAddress: simpleAccountFactory.address,
        entryPointAddress: entryPoint.address
      }
    })

    await signer.sendTransaction({
      from: accounts[0],
      to: account.address,
      value: parseEther('2')
    })
    await account.executeTransaction({ dest: accounts[2], value: parseEther('1'), data: '0x' })
  })
})
