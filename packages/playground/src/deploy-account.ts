import { ethers } from 'ethers'
import { AccountFactory } from '@accountjs/sdk'
import { formatEther, parseEther } from 'ethers/lib/utils'

// This file can be used to play around with the AccountJS SDK
interface Config {
  RPC_URL: string
  DEPLOYER_ADDRESS_PRIVATE_KEY: string
  SALT_NONCE: string
}

const configExample: Config = {
  RPC_URL: 'https://goerli.infura.io/v3/<INFURA_KEY>',
  DEPLOYER_ADDRESS_PRIVATE_KEY: '<DEPLOYER_PRIVATE_KEY>',
  SALT_NONCE: '<SALT_NONCE_NUMBER>'
}

const ID = ethers.utils.id('1234567890')
const config: typeof configExample = {
  RPC_URL: 'http://localhost:8545',
  DEPLOYER_ADDRESS_PRIVATE_KEY:
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  SALT_NONCE: ID
}

async function main(): Promise<void> {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL)
  const deployerSigner = new ethers.Wallet(config.DEPLOYER_ADDRESS_PRIVATE_KEY, provider)
  const deployerAddress = await deployerSigner.getAddress()

  // Create AccountFactory instance
  const accountFactory = await AccountFactory.create({ signer: deployerSigner })

  // Config of the salt
  const saltNonce = config.SALT_NONCE

  // Create account
  const account = await accountFactory.createAccount({
    signer: deployerSigner,
    salt: saltNonce
  })
  await deployerSigner.sendTransaction({
    from: deployerAddress,
    to: account.address,
    value: parseEther('2')
  })
  const balance = await account.getBalance()
  console.log('🚀 ~ file: account.test.ts:47 ~ it ~ balance:', formatEther(balance))
  await account.executeTransaction({ to: deployerAddress, value: parseEther('1'), data: '0x' })
  const balanceAfterExecute = await account.getBalance()
  console.log(
    '🚀 ~ file: deploy-account.ts:59 ~ main ~ balanceAfterExecute:',
    formatEther(balanceAfterExecute)
  )
}

main().catch((error) => {
  console.log(error)
  process.exit(1)
})
