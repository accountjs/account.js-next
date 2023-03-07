import { BigNumberish, ethers } from 'ethers/'
import { hexConcat } from 'ethers/lib/utils'
import { TransactionReceipt, TransactionRequest } from '@ethersproject/abstract-provider'
import { SimpleAccountFactory, SimpleAccount } from '@account-abstraction/contracts'
import { getFactoryContract, getAccountContract, getEntryPointContract } from './getContracts'
import { Address } from './types'

export interface PaymasterConfig {
  address: Address
  tokenAddress: Address
}

export interface AccountInitConfig {
  signer: ethers.Signer
  salt?: string
  paymasterConfig?: PaymasterConfig
}

export interface CreateAccountConfig {
  signer: ethers.Signer
  salt?: string
  paymasterConfig?: PaymasterConfig
  // TODO
  customAccountFactoryAddress?: string
}

export class Account {
  #provider!: ethers.providers.Provider
  #signer!: ethers.Signer
  #accountFactoryContract!: SimpleAccountFactory
  #accountContract!: SimpleAccount

  chainId!: number
  address!: Address
  isInitialized = false
  isActivating = false
  isDeployed = false

  static async create(config: CreateAccountConfig): Promise<Account> {
    const account = new Account()
    await account.init(config)
    return account
  }

  private async init({ signer, salt: identitySalt }: AccountInitConfig): Promise<void> {
    signer._checkProvider()
    this.#signer = signer
    this.#provider = signer.provider!
    this.chainId = await this.#provider.getNetwork().then((network) => network.chainId)

    // Assign before _computeAddress access the contract address
    this.#accountFactoryContract = await getFactoryContract({
      provider: this.#provider,
      chainId: this.chainId
    })

    const address = await this._computeAddress(await this.#signer.getAddress(), identitySalt)
    if (!address) {
      throw new Error('Account contract is not deployed on the current network')
    }
    this.address = address
    this.#accountContract = await getAccountContract({
      provider: this.#provider,
      chainId: this.chainId,
      address
    })
    this.isInitialized = true
  }

  private async _computeAddress(ownerAddress: string, salt?: string): Promise<Address | void> {
    const identitySalt = salt ?? (Date.now() * 1000 + Math.floor(Math.random() * 1000)).toString()
    const initCode = this._encodeInitCode(ownerAddress, identitySalt)

    try {
      const epContract = await getEntryPointContract({
        provider: this.#provider,
        chainId: this.chainId
      })
      await epContract.callStatic.getSenderAddress(initCode)
    } catch (e) {
      const error = e as undefined | { errorArgs?: { sender?: Address } }
      if (error?.errorArgs?.sender) {
        return error.errorArgs.sender
      }
    }
  }

  private _encodeInitCode(ownerAddress: string, identitySalt: string): string {
    return hexConcat([
      this.#accountFactoryContract.address,
      this.#accountFactoryContract.interface.encodeFunctionData('createAccount', [
        ownerAddress,
        identitySalt
      ])
    ])
  }

  // TODO: Change to deploy
  async activateAccount(callback?: (tx: TransactionReceipt) => void): Promise<void> {
    try {
      this.isActivating = true
      const address = this.address
      const tx = await this.#signer.sendTransaction({
        to: address,
        value: 0,
        gasLimit: 100000
      })
      const txReceipt = await tx.wait()
      this.isDeployed = true
      this.isActivating = false
      callback?.(txReceipt)
    } catch (e) {
      this.isActivating = false
      throw e
    }
  }

  async getBatchExecutionTransaction(txs: TransactionRequest[]): Promise<TransactionRequest> {
    const accountContract = this.#accountContract
    const destinations = txs.map((tx) => tx.to ?? '')
    const callDatas = txs.map((tx) => tx.data ?? '0x00')
    const finalCallData = accountContract.interface.encodeFunctionData('executeBatch', [
      destinations,
      callDatas
    ])
    const target = await this.address
    return {
      to: target,
      data: finalCallData,
      from: target
    }
  }

  async getExecutionTransaction(
    target: string,
    value: BigNumberish,
    data: string
  ): Promise<string> {
    const accountContract = this.#accountContract
    return accountContract.interface.encodeFunctionData('execute', [target, value, data])
  }

  async isAccountDeployed() {
    if (!this.#signer.provider) {
      throw new Error('S')
    }
  }
}
