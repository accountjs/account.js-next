import type { ethers } from 'ethers'
import type { SimpleAccountFactory } from '@account-abstraction/contracts'
import { getAccountFactoryContract } from './utils/getContracts'
import type { CreateAccountConfig } from './account'
import { Account } from './account'

interface AccountFactoryInitConfig {
  signer: ethers.Signer
}

export class AccountFactory {
  #signer!: ethers.Signer
  #chainId!: number
  #factoryContract!: SimpleAccountFactory

  static async create(config: AccountFactoryInitConfig): Promise<AccountFactory> {
    const factory = new AccountFactory()
    await factory.init(config)
    return factory
  }

  private async init({ signer }: AccountFactoryInitConfig): Promise<void> {
    signer._checkProvider()
    this.#signer = signer
    const chainId = await signer.provider!.getNetwork().then((nw) => nw.chainId)
    this.#chainId = chainId
    this.#factoryContract = await getAccountFactoryContract({
      signerOrProvider: signer.provider!,
      chainId
    })
  }

  getAddress() {
    return this.#factoryContract.address
  }

  async createAccount({ salt: identitySalt }: CreateAccountConfig): Promise<Account> {
    return Account.create({ salt: identitySalt, signer: this.#signer })
  }
}
