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

const configExample: Config = {
  RPC_URL: 'https://goerli.infura.io/v3/<INFURA_KEY>',
  DEPLOYER_ADDRESS_PRIVATE_KEY: '<DEPLOYER_PRIVATE_KEY>',
  SALT_NONCE: '<SALT_NONCE_NUMBER>',
  TOKEN_ADDRESS: '<TOKEN_ADDRESS>'
}

const config: typeof configExample = {
  RPC_URL: 'http://localhost:8545',
  DEPLOYER_ADDRESS_PRIVATE_KEY:
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  TOKEN_ADDRESS: '0x0f7a41bc01b661847d07077168c439abff37db8d'
}

async function main(): Promise<void> {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL)
  const deployerSigner = new ethers.Wallet(config.DEPLOYER_ADDRESS_PRIVATE_KEY, provider)
  const tokenAddress = config.TOKEN_ADDRESS
  const token = new ethers.Contract(tokenAddress, erc20Abi)

  // Create AccountFactory instance
  const accountFactory = await AccountFactory.create({ signer: deployerSigner })

  // Create account
  const account1 = await accountFactory.createAccount({
    signer: deployerSigner,
    salt: ethers.utils.id('1')
  })
  const account2 = await accountFactory.createAccount({
    signer: deployerSigner,
    salt: ethers.utils.id('2')
  })

  const balance1 = await token.balanceOf(account1.address)
  const balance2 = await token.balanceOf(account2.address)
  console.log('Account1:', account1.address)
  console.log('Balance:', ethers.utils.formatEther(balance1))
  console.log('---')
  console.log('Account2:', account2.address)
  console.log('Balance:', ethers.utils.formatEther(balance2))

  const transferAmount = ethers.utils.parseEther('1')
  // Execute approve and transfer
  const tx1 = {
    to: tokenAddress,
    data: token.interface.encodeFunctionData('approve', [account2.address, transferAmount])
  }
  const tx2 = {
    to: tokenAddress,
    data: token.interface.encodeFunctionData('transferFrom', [
      account1.address,
      account2.address,
      transferAmount
    ])
  }
  const batchTxData = await account1.encodeBatchExecutionTransaction([tx1, tx2])
  await account1.executeTransaction({
    to: tokenAddress,
    data: batchTxData,
    value: 0
  })
}

main().catch((error) => {
  console.log(error)
  process.exit(1)
})
