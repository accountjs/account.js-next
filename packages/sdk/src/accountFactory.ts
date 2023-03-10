import type { ethers } from 'ethers'
import type { AccountFactory as AccountFactoryContract } from '../types'
import type { ContractConfig } from './types'
import { getAccountFactoryContract } from './utils/getContracts'
import { Account } from './account'
import { calculateAccountAddress } from './utils/address'

interface AccountFactoryInitConfig {
  signer: ethers.Signer
  customContracts?: ContractConfig
}

export class AccountFactory {
  #signer!: ethers.Signer
  #provider!: ethers.providers.Provider
  #factoryContract!: AccountFactoryContract
  #customContracts?: ContractConfig

  static async create(config: AccountFactoryInitConfig): Promise<AccountFactory> {
    const factory = new AccountFactory()
    await factory.init(config)
    return factory
  }

  private async init({ signer, customContracts }: AccountFactoryInitConfig): Promise<void> {
    if (!signer.provider) {
      throw new Error('Signer must connect to a provider')
    }

    this.#signer = signer
    this.#provider = signer.provider
    this.#customContracts = customContracts
    const chainId = await signer.provider.getNetwork().then((nw) => nw.chainId)
    this.#factoryContract = await getAccountFactoryContract({
      signerOrProvider: signer,
      customContracts,
      chainId
    })
  }

  getAddress(): string {
    return this.#factoryContract.address
  }

  async getChainId(): Promise<number> {
    return this.#provider.getNetwork().then((network) => network.chainId)
  }

  async predictAccountAddress(salt: string) {
    return calculateAccountAddress(this.#factoryContract, salt, this.#signer)
  }

  async deployAccount(salt?: string) {
    const signerAddress = await this.#signer.getAddress()
    if (!signerAddress) {
      throw new Error('Provider must be initialized with a signer to use this method')
    }
    const identitySalt = salt ?? (Date.now() * 1000 + Math.floor(Math.random() * 1000)).toString()
    // Wait until contract deployed
    await this.#factoryContract.createAccount(signerAddress, identitySalt).then((tx) => tx.wait())
    const accountAddress = await this.predictAccountAddress(identitySalt)
    const isContractDeployed = await this.#provider
      .getCode(accountAddress)
      .then((code) => code !== '0x')
    if (!isContractDeployed) {
      throw new Error('Account contract is not deployed on the current network')
    }
    const account = await Account.create({
      accountAddress,
      signer: this.#signer,
      customContracts: this.#customContracts
    })
    return account
  }
}
