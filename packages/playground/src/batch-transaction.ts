import { ethers } from 'ethers'
import { erc20Abi } from 'abitype/test'
import { AccountFactory } from '../../sdk/dist/src'

// This file can be used to play around with the AccountJS SDK
interface Config {
  RPC_URL: string
  DEPLOYER_ADDRESS_PRIVATE_KEY: string
  SALT_NONCE?: string
  TOKEN_ADDRESS: string
}

const config: Config = {
  RPC_URL: 'https://goerli.infura.io/v3/<INFURA_KEY>',
  DEPLOYER_ADDRESS_PRIVATE_KEY: '<DEPLOYER_PRIVATE_KEY>',
  SALT_NONCE: '<SALT_NONCE_NUMBER>',
  TOKEN_ADDRESS: '<TOKEN_ADDRESS>'
}

async function main(): Promise<void> {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL)
  const deployerSigner = new ethers.Wallet(config.DEPLOYER_ADDRESS_PRIVATE_KEY, provider)
  const tokenAddress = config.TOKEN_ADDRESS
  const token = new ethers.Contract(tokenAddress, erc20Abi)

  // Create AccountFactory instance
  const accountFactory = await AccountFactory.create({ signer: deployerSigner })

  // Create account
  const aliceAccount = await accountFactory.deployAccount({
    salt: ethers.utils.id('1')
  })
  const bobAccount = await accountFactory.deployAccount({
    salt: ethers.utils.id('2')
  })
  const bobAddress = bobAccount.getAddress()
  const acliceAddress = aliceAccount.getAddress()
  const bobBalance = await token.balanceOf(bobAddress)
  const aliceBalance = await token.balanceOf(acliceAddress)
  console.log('bob:', bobAddress)
  console.log('bob balance:', ethers.utils.formatEther(bobBalance))
  console.log('---')
  console.log('alice:', acliceAddress)
  console.log('alice balance:', ethers.utils.formatEther(aliceBalance))

  const transferAmount = ethers.utils.parseEther('1')
  // Execute mint, approve and transfer
  const mintTokenTx = {
    to: tokenAddress,
    data: token.interface.encodeFunctionData('mint', [bobAddress, transferAmount])
  }
  const bobForAliceTokenApprovalTx = {
    to: tokenAddress,
    data: token.interface.encodeFunctionData('approve', [acliceAddress, transferAmount])
  }
  const transferFromBobToAliceTx = {
    to: tokenAddress,
    data: token.interface.encodeFunctionData('transferFrom', [
      bobAddress,
      acliceAddress,
      transferAmount
    ])
  }
  await aliceAccount.executeBatchTransaction([mintTokenTx, bobForAliceTokenApprovalTx])
  await bobAccount.executeTransaction(transferFromBobToAliceTx)
}

main().catch((error) => {
  console.log(error)
  process.exit(1)
})
