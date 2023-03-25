import { UserOperationStruct } from '@account-abstraction/contracts'
import { TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider'
import { ethers, BigNumber, Overrides } from 'ethers'
import { resolveProperties } from 'ethers/lib/utils'
import {
  PrivateRecoveryAccount as PrivateRecoveryAccountContract,
  PrivateRecoveryAccountFactory as PrivateRecoveryAccountFactoryContract,
  EntryPoint as EntryPointContract
} from '../../types'
import { ACCOUNTJS_CONSTANT_SALT } from '../constants'
import {
  AccountInitConfig,
  CreateAccountConfig,
  ExecCallRequest,
  TransactionDetailsForUserOp,
  TransactionOptions
} from '../types/account'
import { Address } from '../types/helpers'
import { getCounterFactualAddress } from '../utils/address'
import { PreVerificationOp, calcPreVerificationGas } from '../utils/calcPreVerificationGas'
import {
  encodeExecutionTransaction,
  encodeFactoryCreateAccountCode,
  getPriorityFee
} from '../utils/contract'
import { getUserOpHash } from '../utils/encode'
import {
  getAccountFactoryContract,
  getEntryPointContract,
  getPrivateRecoveryAccountContract
} from '../utils/getContracts'

export class PrivateRecoveryAccount {
  #provider!: ethers.providers.Provider
  #signer!: ethers.Signer
  #chainId!: number
  #accountFactoryContract!: PrivateRecoveryAccountFactoryContract
  #accountContract!: PrivateRecoveryAccountContract
  #entryPointContract!: EntryPointContract
  #identitySalt!: string

  static async create(config: CreateAccountConfig): Promise<PrivateRecoveryAccount> {
    const account = new PrivateRecoveryAccount()
    await account.init(config)
    return account
  }

  private async init({
    signer,
    salt,
    customContracts,
    accountAddress
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
    this.#accountContract = (await getPrivateRecoveryAccountContract({
      signerOrProvider: signer,
      chainId: this.#chainId,
      address
    })) as unknown as PrivateRecoveryAccountContract
  }

  getAddress(): Address {
    return this.#accountContract.address as Address
  }

  async getChainId(): Promise<number> {
    return this.#provider.getNetwork().then((network) => network.chainId)
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

  /**
   * Returns the ETH balance of the Account.
   * @returns The ETH balance of the Account
   */
  async getBalance(): Promise<BigNumber> {
    return this.#provider.getBalance(this.getAddress())
  }

  async isAccountDeployed(): Promise<boolean> {
    return this.#provider.getCode(this.getAddress()).then((code) => code !== '0x')
  }

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
      maxPriorityFeePerGas,
      // TODO: Add paymaster support
      paymasterAndData: '0x'
    }
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
    const signature = await this.#signer.signMessage(ethers.utils.arrayify(userOpHash))
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

  async getGuardians() {
    const guardians = await this.#accountContract.getGuardians()
    console.log(
      '🚀 ~ file: privateRecoveryAccount.ts:9 ~ PrivateRecoveryAccount ~ getGuardians ~ guardians:',
      guardians
    )
    return guardians
  }
}
