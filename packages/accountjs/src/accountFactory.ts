import { ethers } from 'ethers'
import { Account, CreateAccountConfig } from './account'

interface AccountFactoryInitConfig {
  signer: ethers.Signer
}

export class AccountFactory {
  #signer!: ethers.Signer

  static async create(config: AccountFactoryInitConfig): Promise<AccountFactory> {
    const factory = new AccountFactory()
    await factory.init(config)
    return factory
  }

  private async init({ signer }: AccountFactoryInitConfig): Promise<void> {
    this.#signer = signer
  }

  async createAccount({ salt: identitySalt }: CreateAccountConfig): Promise<Account> {
    return Account.create({ salt: identitySalt, signer: this.#signer })
  }
}
