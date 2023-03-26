import type { Overrides, ethers } from 'ethers'
import { BigNumber } from 'ethers'
import { resolveProperties, arrayify } from 'ethers/lib/utils'
import type { TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider'
import type {
  UserOperationStruct,
  EntryPoint as EntryPointContract,
  SimpleAccountFactory as SimpleAccountFactoryContract,
  SimpleAccount as SimpleAccountContract
} from '@account-abstraction/contracts'
import {
  getAccountFactoryContract,
  getAccountContract,
  getEntryPointContract
} from './utils/getContracts'
import type { Address } from './types/helpers'
import type { PreVerificationOp } from './utils/calcPreVerificationGas'
import { calcPreVerificationGas } from './utils/calcPreVerificationGas'
import { getUserOpHash } from './utils/encode'
import { getCounterFactualAddress } from './utils/address'
import {
  encodeExecutionTransaction,
  encodeFactoryCreateAccountCode,
  getPriorityFee
} from './utils/contract'
import { ACCOUNTJS_CONSTANT_SALT } from './constants'
import type {
  CreateAccountConfig,
  AccountInitConfig,
  TransactionDetailsForUserOp,
  ExecCallRequest,
  TransactionOptions
} from './types/account'
import type { Paymaster } from './paymaster'

export class Account {
  #provider!: ethers.providers.Provider
  #signer!: ethers.Signer
  #chainId!: number
  #accountFactoryContract!: SimpleAccountFactoryContract
  #accountContract!: SimpleAccountContract
  #entryPointContract!: EntryPointContract
  #identitySalt!: string
  #paymaster?: Paymaster

  static async create(config: CreateAccountConfig): Promise<Account> {
    const account = new Account()
    await account.init(config)
    return account
  }

  private async init({
    signer,
    salt,
    customContracts,
    accountAddress,
    paymaster
  }: AccountInitConfig): Promise<void> {
    if (!signer.provider) {
      throw new Error('Signer must be connected to a provider')
    }
    this.#signer = signer
    this.#provider = signer.provider
    this.#chainId = await signer.provider.getNetwork().then((network) => network.chainId)
    this.#accountFactoryContract = await getAccountFactoryContract({
      signerOrProvider: signer,
      chainId: this.#chainId,
      customContracts
    })

    this.#entryPointContract = await getEntryPointContract({
      signerOrProvider: signer,
      chainId: this.#chainId,
      customContracts
    })

    this.#identitySalt = salt ?? ACCOUNTJS_CONSTANT_SALT
    const signerAddress = await signer.getAddress()
    const initCode = encodeFactoryCreateAccountCode(
      this.#accountFactoryContract.address,
      signerAddress,
      this.#identitySalt
    )

    const address =
      accountAddress ?? (await getCounterFactualAddress(initCode, this.#entryPointContract))
    this.#accountContract = await getAccountContract({
      signerOrProvider: signer,
      chainId: this.#chainId,
      address
    })

    paymaster ? this.connectPaymaster(paymaster) : null
  }

  /**
   * Get the chainId of the provider.
   * @returns The chainId.
   */
  async getChainId(): Promise<number> {
    return this.#provider.getNetwork().then((network) => network.chainId)
  }

  /**
   * Returns true if the Account has been deployed.
   * @returns True if the Account has been deployed.
   */
  async isAccountDeployed(): Promise<boolean> {
    return this.#provider.getCode(this.getAddress()).then((code) => code !== '0x')
  }

  /**
   * Returns the address of this Account.
   * @returns The address of this Account.
   */
  getAddress(): Address {
    return this.#accountContract.address as Address
  }

  /**
   * Returns the ETH balance of the Account.
   * @returns The ETH balance of the Account
   */
  async getBalance(): Promise<BigNumber> {
    return this.#provider.getBalance(this.getAddress())
  }

  /**
   * Returns the Account nonce number, return 0 when account has not deployed
   * @returns The number of Account nonce
   */
  async getNonce(): Promise<number> {
    return this.#accountContract
      .nonce()
      .then((bn) => bn.toNumber())
      .catch(() => 0)
  }

  /**
   * Returns the owner of this Account.
   * @returns The owner of this Account.
   */
  async getOwner(): Promise<string> {
    return this.#accountContract.owner()
  }

  async connectPaymaster(paymaster: Paymaster): Promise<string> {
    this.#paymaster = paymaster
    // TODO: if wallet not activated, change calc account address
    // TODO: if wallet activated, just add paymaster
    // TODO: if token is not approve has to approve
    return paymaster.getPaymasterAddress()
  }
  /**
   * activate the Account, deploy the Account contract and set the owner to the signer.
   * @param callback - A callback function that will be called when the transaction is mined.
   */
  async activateAccount(callback?: (tx: TransactionReceipt) => void): Promise<void> {
    const op = await this.createUnsignedUserOp({
      target: this.getAddress(),
      data: '0x',
      value: 0
    })
    const signedOp = await this.signUserOp(op)
    const beneficiary = await this.#signer.getAddress()
    const tx = await this.#entryPointContract.handleOps([signedOp], beneficiary)
    const txReceipt = await tx.wait()
    callback?.(txReceipt)
  }

  /**
   * create a UserOperation, filling all details (except signature)
   * - if account is not yet created, add initCode to deploy it.
   * - if gas or nonce are missing, read them from the chain (note that we can't fill gaslimit before the account is created)
   * @param info
   */
  async createUnsignedUserOp(info: TransactionDetailsForUserOp): Promise<UserOperationStruct> {
    const value = BigNumber.from(info.value ?? 0)
    const callData = await encodeExecutionTransaction(info.target, value, info.data)
    const callGasLimit =
      info.gasLimit ??
      (await this.#provider.estimateGas({
        from: this.#entryPointContract.address,
        to: this.getAddress(),
        data: callData
      }))

    const isAccountDeployed = await this.isAccountDeployed()
    const initCode = isAccountDeployed
      ? '0x'
      : encodeFactoryCreateAccountCode(
          this.#accountFactoryContract.address,
          await this.#signer.getAddress(),
          this.#identitySalt
        )

    const initGas =
      initCode === '0x'
        ? 0
        : await this.#provider.estimateGas({
            to: this.#accountFactoryContract.address,
            data: '0x' + initCode.substring(42)
          })

    const { maxFeePerGas, maxPriorityFeePerGas } = await getPriorityFee(this.#provider, info)
    const partialUserOp: Partial<UserOperationStruct> = {
      sender: this.getAddress(),
      nonce: this.getNonce(),
      initCode,
      callData,
      callGasLimit,
      verificationGasLimit: BigNumber.from(1e5).add(initGas),
      maxFeePerGas,
      maxPriorityFeePerGas
      // TODO: Add paymaster support
      // paymasterAndData: '0x',
    }
    partialUserOp.paymasterAndData = this.#paymaster
      ? await this.#paymaster.getPaymasterAndData(partialUserOp)
      : '0x'
    const op = (await resolveProperties(partialUserOp)) as PreVerificationOp
    return {
      ...partialUserOp,
      preVerificationGas: calcPreVerificationGas(op),
      signature: ''
    } as UserOperationStruct
  }

  /**
   * Sign the filled userOp.
   * @param userOp the UserOperation to sign (with signature field ignored)
   */
  async signUserOp(userOp: UserOperationStruct): Promise<UserOperationStruct> {
    const op = await resolveProperties(userOp)
    const userOpHash = getUserOpHash(op, this.#entryPointContract.address, await this.getChainId())
    const signature = await this.#signer.signMessage(arrayify(userOpHash))
    return {
      ...userOp,
      signature
    }
  }

  /**
   * helper method: create and sign a user operation.
   * @param info transaction details for the userOp
   */
  async createSignedUserOp(info: TransactionDetailsForUserOp): Promise<UserOperationStruct> {
    return await this.signUserOp(await this.createUnsignedUserOp(info))
  }

  /**
   * Executes a transaction.
   *
   * @param CallRequest - The transaction to execute
   * @param options - The transaction execution options. Optional
   * @returns The transaction response
   * @throws "No signature provided"
   * @throws "Not enough Ether funds"
   * @throws "Cannot specify gas and gasLimit together in transaction options"
   */
  async executeTransaction(
    { value, to, data }: ExecCallRequest,
    options?: TransactionOptions
  ): Promise<TransactionResponse> {
    const bigValue = BigNumber.from(value ?? 0)
    if (!bigValue.isZero()) {
      const balance = await this.getBalance()
      if (bigValue.gt(balance)) {
        throw new Error('Not enough Ether funds')
      }
    }
    if (options?.gas && options?.gasLimit) {
      throw new Error('Cannot specify gas and gasLimit together in transaction options')
    }

    const overrides: Overrides = {
      gasLimit: options?.gasLimit,
      maxFeePerGas: options?.maxFeePerGas,
      maxPriorityFeePerGas: options?.maxPriorityFeePerGas
    }

    return await this.#accountContract.execute(to, bigValue, data, overrides)
  }

  /**
   * Executes a batch transaction.
   *
   * @param CallRequest - The transaction to execute
   * @param options - The transaction execution options. Optional
   * @returns The transaction response
   * @throws "No signature provided"
   * @throws "Not enough Ether funds"
   * @throws "Cannot specify gas and gasLimit together in transaction options"
   */
  async executeBatchTransaction(
    txs: ExecCallRequest[],
    options?: TransactionOptions
  ): Promise<TransactionResponse> {
    if (options?.gas && options?.gasLimit) {
      throw new Error('Cannot specify gas and gasLimit together in transaction options')
    }

    const destinations = txs.map((tx) => tx.to ?? '')
    const callDatas = txs.map((tx) => tx.data ?? '0x00')

    const overrides: Overrides = {
      gasLimit: options?.gasLimit,
      maxFeePerGas: options?.maxFeePerGas,
      maxPriorityFeePerGas: options?.maxPriorityFeePerGas
    }

    return await this.#accountContract.executeBatch(destinations, callDatas, overrides)
  }
}
