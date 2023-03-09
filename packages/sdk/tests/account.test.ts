import { deployments, ethers } from 'hardhat'
import { expect } from 'chai'
import { EntryPoint__factory, SimpleAccountFactory__factory } from '@account-abstraction/contracts'
import { parseEther } from 'ethers/lib/utils'
import { TestToken__factory } from '../typechain/factories/contracts/tests/TestToken__factory'
import { CheckBalance__factory } from '../typechain/factories/contracts/tests/CheckBalance__factory'
import { Account } from '../src'

describe('Account', () => {
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

  it('initialize with account contract address', async () => {
    const { signer, simpleAccountFactory, entryPoint } = await setupTests()
    const account = await Account.create({
      signer,
      contractNetwork: {
        accountFactoryAddress: simpleAccountFactory.address,
        entryPointAddress: entryPoint.address
      }
    })
    const address = await account.getAddress()
    expect(address).to.be.a('string')
  })

  it('should be deploy to counterfactual address', async () => {
    const { signer, accounts, simpleAccountFactory, entryPoint } = await setupTests()
    const account = await Account.create({
      signer,
      contractNetwork: {
        accountFactoryAddress: simpleAccountFactory.address,
        entryPointAddress: entryPoint.address
      }
    })
    expect(await account.isAccountDeployed()).to.be.false
    await signer.sendTransaction({
      to: account.address,
      value: parseEther('0.1')
    })
    const op = await account.createSignedUserOp({
      target: ethers.constants.AddressZero,
      data: '0x'
    })
    await entryPoint.handleOps([op], accounts[0])
    expect(await account.isAccountDeployed()).to.be.true
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
    const ONE_ETHER = parseEther('1')
    const TWO_ETHERS = ONE_ETHER.mul(2)
    await signer.sendTransaction({
      from: accounts[0],
      to: account.address,
      value: TWO_ETHERS
    })

    await account.activateAccount()
    const accountBalance = await account.getBalance()
    expect(accountBalance.lte(TWO_ETHERS)).to.be.true
    const tx = {
      to: accounts[2],
      value: ONE_ETHER,
      data: '0x00'
    }
    // Call execute would cost account ethers instead of from signer
    await account.executeTransaction(tx)
    const accountBalanceAfter = await account.getBalance()
    expect(accountBalanceAfter.lt(ONE_ETHER)).to.be.true
  })

  it('should be able to call exec batch transaction', async () => {
    const { signer, accounts, simpleAccountFactory, entryPoint, testToken, checkBalance } =
      await setupTests()
    const account = await Account.create({
      signer,
      contractNetwork: {
        accountFactoryAddress: simpleAccountFactory.address,
        entryPointAddress: entryPoint.address
      }
    })

    const reuiqredGas = parseEther('0.2')
    const MINT_AMOUNT = parseEther('10')

    await signer.sendTransaction({
      from: accounts[0],
      to: account.address,
      value: parseEther('1')
    })

    const tokenBalance = await testToken.balanceOf(account.address)
    expect(tokenBalance.toString()).to.be.eq('0')

    const checkRequiredEthersBalanceTx = {
      to: checkBalance.address,
      data: checkBalance.interface.encodeFunctionData('checkEthers', [reuiqredGas])
    }
    const mintTokenTx = {
      to: testToken.address,
      data: testToken.interface.encodeFunctionData('mint', [account.address, MINT_AMOUNT])
    }
    const transferToSignerTx = {
      to: testToken.address,
      data: testToken.interface.encodeFunctionData('transfer', [accounts[0], parseEther('1')])
    }
    const transferToOtherTx = {
      to: testToken.address,
      data: testToken.interface.encodeFunctionData('transfer', [accounts[1], parseEther('9')])
    }
    const txs = [checkRequiredEthersBalanceTx, mintTokenTx, transferToSignerTx, transferToOtherTx]

    await account.activateAccount()

    await expect(account.executeBatchTransaction(txs))
      .to.emit(checkBalance, 'CheckedBalance')
      .withArgs(account.address, reuiqredGas)

    const tokenBalanceAfterTransfered = await testToken.balanceOf(account.address)
    expect(tokenBalanceAfterTransfered).to.be.deep.eq(parseEther('0'))

    const userOp = await account.createSignedUserOp({
      target: account.address,
      data: await account.encodeBatchExecutionTransaction(txs)
    })

    await entryPoint.handleOps([userOp], account.address)
  })

  // it('execute batch ops from entryPoint.handleOps', async () => {
  //   const { signer, accounts, simpleAccountFactory, entryPoint, testToken, checkBalance } =
  //     await setupTests()
  //   const account = await Account.create({
  //     signer,
  //     contractNetwork: {
  //       accountFactoryAddress: simpleAccountFactory.address,
  //       entryPointAddress: entryPoint.address
  //     }
  //   })
  //   const beneficiary = account.address
  //   const reuiqredGas = parseEther('0.2')
  //   const TEN_TOKEN = parseEther('10')

  //   await signer.sendTransaction({
  //     from: accounts[0],
  //     to: account.address,
  //     value: parseEther('2')
  //   })

  //   expect(await testToken.balanceOf(account.address)).to.be.eq(0)

  //   const checkRequiredEthersBalanceTx = await account.createSignedUserOp({
  //     target: checkBalance.address,
  //     data: checkBalance.interface.encodeFunctionData('checkEthers', [reuiqredGas])
  //   })

  //   await testToken.mint(account.address, TEN_TOKEN)
  //   const accountInitialERC20Balance = await testToken.balanceOf(account.address)
  //   expect(accountInitialERC20Balance).to.be.deep.eq(TEN_TOKEN)

  //   // FIX: Why is this op wonldn't success? But executeTransaction would
  //   // const mintTokenOp = await account.createSignedUserOp({
  //   //   target: testToken.address,
  //   //   data: testToken
  //   //     .connect(account.address)
  //   //     .interface.encodeFunctionData('mint', [account.address, TEN_TOKEN])
  //   // })
  //   // const transferToSignerOp = await account.createSignedUserOp({
  //   //   target: testToken.address,
  //   //   data: testToken.interface.encodeFunctionData('transferFrom', [
  //   //     account.address,
  //   //     accounts[0],
  //   //     parseEther('1')
  //   //   ])
  //   // })
  //   const transferToOtherOp = await account.createSignedUserOp({
  //     target: testToken.address,
  //     data: testToken.interface.encodeFunctionData('transfer', [accounts[1], parseEther('9')])
  //   })
  //   const userOps = [
  //     checkRequiredEthersBalanceTx,
  //     // mintTokenOp,
  //     // transferToSignerOp
  //     transferToOtherOp
  //   ]

  //   expect(await account.isAccountDeployed()).to.be.false

  //   const estimatedGas = await entryPoint.estimateGas.handleOps(userOps, beneficiary)
  //   console.log('🚀 ~ file: account.test.ts:209 ~ it ~ estimatedGas:', estimatedGas)
  //   await expect(
  //     entryPoint.handleOps(userOps, beneficiary, { gasLimit: estimatedGas.mul(3).div(2) })
  //   )
  //     .to.emit(checkBalance, 'CheckedBalance')
  //     .withArgs(account.address, reuiqredGas)
  //     .to.emit(entryPoint, 'AccountDeployed')

  //   expect(await account.isAccountDeployed()).to.be.true

  //   console.log(
  //     '🚀 ~ file: account.test.ts:199 ~ it ~ await testToken.balanceOf(account.address):',
  //     await testToken.balanceOf(account.address)
  //   )
  //   expect(await testToken.balanceOf(account.address)).to.be.deep.eq(TEN_TOKEN)
  // })
})
