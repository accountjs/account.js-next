import { deployments, ethers } from 'hardhat'
import { expect } from 'chai'
import { AccountFactory } from '../src'
import { EntryPoint__factory, AccountFactory__factory } from '../types'
import { calculateAccountAddress } from '../src/utils/address'

describe('AccountFactory', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await ethers.provider.listAccounts()
    const signer = ethers.provider.getSigner()
    const entryPoint = await new EntryPoint__factory(signer).deploy()
    const simpleAccountFactory = await new AccountFactory__factory(signer).deploy(
      entryPoint.address
    )
    return { accounts, signer, entryPoint, simpleAccountFactory }
  })

  it('initialize with factory contract address', async () => {
    const { signer } = await setupTests()
    const accountFactory = await AccountFactory.create({ signer })
    expect(accountFactory.getAddress()).to.be.a('string')
  })

  it('should deploy account', async () => {
    const { signer, simpleAccountFactory, entryPoint } = await setupTests()
    const accountFactory = await AccountFactory.create({
      signer,
      customContracts: {
        accountFactoryAddress: simpleAccountFactory.address,
        entryPointAddress: entryPoint.address
      }
    })

    const salt = '123'
    const account = await accountFactory.deployAccount(salt)
    expect(account.getAddress()).to.be.a.string
    const predicatedAddress = await calculateAccountAddress(simpleAccountFactory, salt, signer)
    expect(predicatedAddress).to.be.deep.eq(account.getAddress())
  })
})
