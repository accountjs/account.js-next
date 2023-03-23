import { ContractReceipt, ethers } from 'ethers'
import { Account, AccountFactory } from '@accountjs/sdk'

// This file can be used to play around with the AccountJS SDK
interface Config {
  BUNDLER_RPC_URL: string
  DEPLOYER_ADDRESS_PRIVATE_KEY: string
  SALT_NONCE: string
}

const config: Config = {
  BUNDLER_RPC_URL: 'https://goerli.infura.io/v3/<INFURA_KEY>',
  DEPLOYER_ADDRESS_PRIVATE_KEY: '<DEPLOYER_PRIVATE_KEY>',
  SALT_NONCE: '<SALT_NONCE_NUMBER>'
}

async function main(): Promise<void> {
  const provider = new ethers.providers.JsonRpcProvider(config.BUNDLER_RPC_URL)
  const deployerSigner = new ethers.Wallet(config.DEPLOYER_ADDRESS_PRIVATE_KEY, provider)

  // Create AccountFactory instance
  // Token Account
  const account = await Account.create({
    signer: deployerSigner,
    customContracts: {
      // fatory for token
      accountFactoryAddress: '...'
    }
  })

  const paymaster = new paymaster(tokenAddress)
  account.connectPaymaster(paymaster)

  // transfer operation
  const op = account.createSignedUserOp({ data: '', target: '' })

  const serviceClient = new ServiceClient({ provider })

  const transactionHash = serviceClient.sendUserOp(op)
}

main().catch((error) => {
  console.log(error)
  process.exit(1)
})
