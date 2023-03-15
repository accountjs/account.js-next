import { deployments, ethers } from 'hardhat'
import { expect } from 'chai'
import type { TransactionReceipt } from '@ethersproject/abstract-provider'
import { AccountFactory } from '../src'
import { calculateAccountAddress } from '../src/utils/address'
import { getAccountFactory, getEntryPoint } from './utils/setupContracts'

describe('AccountFactory', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await ethers.provider.listAccounts()
    const signer = ethers.provider.getSigner()

    return {
      accounts,
      signer,
      entryPoint: (await getEntryPoint()).contract,
      simpleAccountFactory: (await getAccountFactory()).contract
    }
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

    // TODO: Mock fn
    function callback(receipt: TransactionReceipt) {
      // eslint-disable-next-line no-console
      console.log(
        '🚀 ~ file: accountFactory.test.ts:39 ~ account ~ receipt hash:',
        receipt.transactionHash
      )
    }
    const salt = '123'
    const account = await accountFactory.deployAccount({
      salt,
      callback
    })
    expect(account.getAddress()).to.be.a.string
    const signerAddress = await signer.getAddress()
    const predicatedAddress = await calculateAccountAddress(
      simpleAccountFactory,
      salt,
      signerAddress
    )
    expect(predicatedAddress).to.be.deep.eq(account.getAddress())
  })
})
