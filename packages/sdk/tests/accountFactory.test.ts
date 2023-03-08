import { deployments, ethers } from 'hardhat'
import { expect } from 'chai'
import { AccountFactory } from '../src'

describe('AccountFactory', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await ethers.provider.listAccounts()
    const signer = await ethers.provider.getSigner()
    return { accounts, signer }
  })

  it('initialize with factory contract address', async () => {
    const { signer } = await setupTests()
    const accountFactory = await AccountFactory.create({ signer })
    expect(accountFactory.getAddress()).to.be.a('string')
  })
})
