import { ContractReceipt, ethers } from 'ethers'
import { AccountFactory } from '@accountjs/sdk'

// This file can be used to play around with the AccountJS SDK
interface Config {
  RPC_URL: string
  DEPLOYER_ADDRESS_PRIVATE_KEY: string
  SALT_NONCE: string
}

const config: Config = {
  RPC_URL: 'https://goerli.infura.io/v3/<INFURA_KEY>',
  DEPLOYER_ADDRESS_PRIVATE_KEY: '<DEPLOYER_PRIVATE_KEY>',
  SALT_NONCE: '<SALT_NONCE_NUMBER>'
}

async function main(): Promise<void> {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL)
  const deployerSigner = new ethers.Wallet(config.DEPLOYER_ADDRESS_PRIVATE_KEY, provider)

  // Create AccountFactory instance
  const accountFactory = await AccountFactory.create({ signer: deployerSigner })

  // Config of the salt
  const salt = config.SALT_NONCE

  // Predict deployed address
  const predictedDeployAddress = await accountFactory.predictAccountAddress(
    salt,
    await deployerSigner.getAddress()
  )

  const callback = (receipt: ContractReceipt) => {
    console.log('Transaction hash:', receipt.transactionHash)
  }

  // Create account
  const account = await accountFactory.deployAccount({ salt: salt, callback })

  console.log('Predicted deployed address:', predictedDeployAddress)
  console.log('Deployed Account:', account.getAddress())
}

main().catch((error) => {
  console.log(error)
  process.exit(1)
})
