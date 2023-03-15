import { deployments, ethers } from 'hardhat'
import { expect } from 'chai'
import { parseEther } from 'ethers/lib/utils'
import { TestToken__factory, CheckBalance__factory } from '../types'
import { Account } from '../src'
import { getAccountFactory, getEntryPoint } from './utils/setupContracts'
import { getContractNetwork } from './utils/setupContractNetwork'

describe('Account', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await ethers.provider.listAccounts()
    const signer = await ethers.provider.getSigner()
    const testToken = await new TestToken__factory(signer).deploy()
    const checkBalance = await new CheckBalance__factory(signer).deploy()

    return {
      accounts,
      signer,
      testToken,
      accountFactory: (await getAccountFactory()).contract,
      entryPoint: (await getEntryPoint()).contract,
      checkBalance,
      customContracts: await getContractNetwork()
    }
  })

  it('initialize with account contract address', async () => {
    const { signer, customContracts } = await setupTests()
    const account = await Account.create({
      signer,
      customContracts
    })
    expect(account.getAddress()).to.be.a('string')
  })

  it('should be deploy to counterfactual address', async () => {
    const { signer, accounts, entryPoint, customContracts } = await setupTests()
    const account = await Account.create({
      signer,
      customContracts
    })
    expect(await account.isAccountDeployed()).to.be.false
    await signer.sendTransaction({
      to: account.getAddress(),
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
    const { signer, accounts, customContracts } = await setupTests()
    const account = await Account.create({
      signer,
      customContracts
    })
    const ONE_ETHER = parseEther('1')
    const TWO_ETHERS = ONE_ETHER.mul(2)
    await signer.sendTransaction({
      from: accounts[0],
      to: account.getAddress(),
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
    const { signer, accounts, testToken, checkBalance, customContracts } = await setupTests()
    const account = await Account.create({
      signer,
      customContracts
    })
    const accountAddress = account.getAddress()

    const reuiqredGas = parseEther('0.2')
    const MINT_AMOUNT = parseEther('10')

    await signer.sendTransaction({
      from: accounts[0],
      to: accountAddress,
      value: parseEther('1')
    })

    const checkRequiredEthersBalanceTx = {
      to: checkBalance.address,
      data: checkBalance.interface.encodeFunctionData('checkEthers', [reuiqredGas])
    }
    const mintTokenTx = {
      to: testToken.address,
      data: testToken.interface.encodeFunctionData('mint', [accountAddress, MINT_AMOUNT])
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
      .withArgs(accountAddress, reuiqredGas)

    const tokenBalanceAfterTransfered = await testToken.balanceOf(accountAddress)
    expect(tokenBalanceAfterTransfered).to.be.deep.eq(parseEther('0'))
  })

  // it('execute batch ops from entryPoint.handleOps', async () => {
  //   const { signer, accounts, customContracts, entryPoint, testToken, checkBalance } =
  //     await setupTests()
  //   const account = await Account.create({
  //     signer,
  //     customContracts
  //   })
  //   const accountAddress = account.getAddress()
  //   const beneficiary = accountAddress
  //   const reuiqredGas = parseEther('0.2')
  //   const TEN_TOKEN = parseEther('10')

  //   await signer.sendTransaction({
  //     from: accounts[0],
  //     to: accountAddress,
  //     value: parseEther('2')
  //   })

  //   expect(await testToken.balanceOf(accountAddress)).to.be.eq(0)

  //   expect(await account.isAccountDeployed()).to.be.false
  //   await account.activateAccount()
  //   expect(await account.isAccountDeployed()).to.be.true

  //   const mintTokenOp = await account.createSignedUserOp({
  //     target: testToken.address,
  //     data: testToken.interface.encodeFunctionData('mint', [accountAddress, TEN_TOKEN])
  //   })
  //   await entryPoint.handleOps([mintTokenOp], beneficiary)
  //   expect(await testToken.balanceOf(accountAddress)).to.be.deep.eq(TEN_TOKEN)

  //   // Create batch operations after account creation, which would update further operations initCode to '0x'
  //   const checkRequiredEthersBalanceOp = await account.createSignedUserOp({
  //     target: checkBalance.address,
  //     data: checkBalance.interface.encodeFunctionData('checkEthers', [reuiqredGas])
  //   })
  //   const approveToSignerOp = await account.createSignedUserOp({
  //     target: testToken.address,
  //     data: testToken
  //       .connect(accountAddress)
  //       .interface.encodeFunctionData('approve', [accounts[0], parseEther('1')])
  //   })
  //   const transferToSignerOp = await account.createSignedUserOp({
  //     target: testToken.address,
  //     data: testToken.interface.encodeFunctionData('transferFrom', [
  //       accountAddress,
  //       accounts[0],
  //       parseEther('1')
  //     ]),
  //     // Custom gaslimit to by pass estimate error
  //     gasLimit: 1e6
  //   })
  //   const transferToOtherOp = await account.createSignedUserOp({
  //     target: testToken.address,
  //     data: testToken.interface.encodeFunctionData('transfer', [accounts[1], parseEther('9')])
  //   })
  //   // TODO: Error: invalid nonce
  //   const userOps: UserOperationStruct[] = [
  //     checkRequiredEthersBalanceOp,
  //     approveToSignerOp,
  //     transferToSignerOp,
  //     transferToOtherOp
  //   ]

  //   await expect(entryPoint.handleOps(userOps, beneficiary))
  //     .to.emit(checkBalance, 'CheckedBalance')
  //     .withArgs(accountAddress, reuiqredGas)
  //     .to.emit(testToken, 'Approval')
  //     .withArgs(accounts[0], parseEther('1'))
  // })
})
