import type { BigNumberish } from 'ethers'
import { BigNumber, ethers } from 'ethers'
import { hexConcat, resolveProperties } from 'ethers/lib/utils'
import type {
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import type {
  SimpleAccountFactory,
  SimpleAccount,
  EntryPoint,
  UserOperationStruct
} from '@account-abstraction/contracts'
import {
  getAccountFactoryContract,
  getAccountContract,
  getEntryPointContract
} from './utils/getContracts'
import type { Address, ContractNetworkConfig } from './types'
import type { PreVerificationOp } from './utils/calcPreVerificationGas'
import { calcPreVerificationGas } from './utils/calcPreVerificationGas'
import { getUserOpHash } from './utils/encode'

export interface PaymasterConfig {
  address: Address
  tokenAddress: Address
}

export interface AccountInitConfig {
  signer: ethers.Signer
  salt?: string
  paymasterConfig?: PaymasterConfig
  contractNetwork?: ContractNetworkConfig
}

export interface CreateAccountConfig {
  signer: ethers.Signer
  salt?: string
  contractNetwork?: ContractNetworkConfig
  paymasterConfig?: PaymasterConfig
}

export interface TransactionDetailsForUserOp {
  target: string
  data: string
  value?: BigNumberish
  gasLimit?: BigNumberish
  maxFeePerGas?: BigNumberish
  maxPriorityFeePerGas?: BigNumberish
}

export type ExecCallRequest = {
  to: string
  data: string
  value?: BigNumberish
}

export interface TransactionOptions {
  value?: BigNumberish
  gas?: BigNumberish
  gasLimit?: BigNumberish
  maxFeePerGas?: BigNumberish
  maxPriorityFeePerGas?: BigNumberish
}

export class Account {
  #provider!: ethers.providers.Provider
  #signer!: ethers.Signer
  #accountFactoryContract!: SimpleAccountFactory
  #accountContract!: SimpleAccount
  #entryPointContract!: EntryPoint
  #salt!: string
  #isDeployed = false

  chainId!: number
  address!: Address
  isInitialized = false

  static async create(config: CreateAccountConfig): Promise<Account> {
    const account = new Account()
    await account.init(config)
    return account
  }

  private async init({ signer, salt, contractNetwork }: AccountInitConfig): Promise<void> {
    if (!signer.provider) {
      throw new Error('Signer must be connected to a provider')
    }
    this.#signer = signer
    this.#provider = signer.provider
    this.#salt = salt ?? (Date.now() * 1000 + Math.floor(Math.random() * 1000)).toString()
    this.chainId = await this.#provider.getNetwork().then((network) => network.chainId)

    // Assign before _computeAddress access the contract address
    this.#accountFactoryContract = await getAccountFactoryContract({
      signerOrProvider: signer,
      chainId: this.chainId,
      contractNetwork
    })

    this.#entryPointContract = await getEntryPointContract({
      signerOrProvider: signer,
      chainId: this.chainId,
      contractNetwork
    })

    const address = await this.getAddress()
    if (!address) {
      throw new Error('Unable to locate your account address')
    }
    this.address = address
    this.#accountContract = await getAccountContract({
      signerOrProvider: signer,
      chainId: this.chainId,
      address
    })
    this.isInitialized = true
  }

  async getAddress(): Promise<Address | void> {
    const initCode = await this.encodeInitCode()

    try {
      await this.#entryPointContract.callStatic.getSenderAddress(initCode)
    } catch (e) {
      const error = e as undefined | { errorArgs?: { sender?: Address } }
      if (error?.errorArgs?.sender) {
        return error.errorArgs.sender
      }
    }

    throw new Error('Should handle revert')
  }

  private async encodeInitCode(): Promise<string> {
    return hexConcat([
      this.#accountFactoryContract.address,
      this.#accountFactoryContract.interface.encodeFunctionData('createAccount', [
        await this.#signer.getAddress(),
        this.#salt
      ])
    ])
  }

  async activateAccount(callback?: (tx: TransactionReceipt) => void): Promise<void> {
    const op = await this.createUnsignedUserOp({
      target: this.address,
      data: '0x00',
      value: 0
    })
    const signedOp = await this.signUserOp(op)
    const beneficiary = await this.#signer.getAddress()
    const tx = await this.#entryPointContract.handleOps([signedOp], beneficiary)
    const txReceipt = await tx.wait()
    callback?.(txReceipt)
  }

  /**
   * Signs a hash using the current signer account.
   *
   * @param hash - The hash to sign
   * @returns The Account signature
   */
  async signTransactionHash(hash: string): Promise<string> {
    return await this.#signer.signMessage(ethers.utils.arrayify(hash))
  }

  /**
   * return userOpHash for signing.
   * This value matches entryPoint.getUserOpHash (calculated off-chain, to avoid a view call)
   * @param userOp userOperation, (signature field ignored)
   */
  async getUserOpHash(userOp: UserOperationStruct): Promise<string> {
    const op = await resolveProperties(userOp)
    return getUserOpHash(op, this.#entryPointContract.address, this.chainId)
  }

  /**
   * Sign the filled userOp.
   * @param userOp the UserOperation to sign (with signature field ignored)
   */
  async signUserOp(userOp: UserOperationStruct): Promise<UserOperationStruct> {
    const userOpHash = await this.getUserOpHash(userOp)
    const signature = this.signTransactionHash(userOpHash)
    return {
      ...userOp,
      signature
    }
  }

  async isAccountDeployed(): Promise<boolean> {
    if (this.#isDeployed) {
      return this.#isDeployed
    }

    if (!this.#signer.provider) {
      throw new Error('SDK not initialized')
    }
    const address = await this.getAddress()
    if (!address) {
      throw new Error('SDK not initialized')
    }
    const codeAtAddress = await this.#provider.getCode(address)
    const isDeployed = codeAtAddress !== '0x'
    if (isDeployed) {
      this.#isDeployed = true
    }
    return isDeployed
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

  async requireDeployed() {
    const isDeployed = await this.isAccountDeployed()
    if (!isDeployed) {
      throw new Error('Account not deployed')
    }
  }

  /**
   * Returns the owner of this Account.
   *
   * @returns The owner of this Account.
   */
  async getOwner(): Promise<string> {
    await this.requireDeployed()
    return this.#accountContract.owner({ gasLimit: 1e6 })
  }

  /**
   * Returns the chainId of the connected network.
   *
   * @returns The chainId of the connected network
   */
  async getChainId(): Promise<number> {
    return this.#provider.getNetwork().then((nw) => nw.chainId)
  }

  /**
   * Returns the ETH balance of the Account.
   *
   * @returns The ETH balance of the Account
   */
  async getBalance(): Promise<BigNumber> {
    return this.#provider.getBalance(this.address)
  }

  /**
   * return maximum gas used for verification.
   * NOTE: createUnsignedUserOp will add to this value the cost of creation, if the contract is not yet created.
   * @returns The gasLimit used for verification
   */
  async getVerificationGasLimit(): Promise<BigNumberish> {
    return 100000
  }

  async estimateGas({ gasLimit, from, to, data }: TransactionRequest) {
    if (gasLimit) {
      return gasLimit
    }
    const estimatedGas = await this.#provider.estimateGas({ from, to, data })
    return estimatedGas
  }

  /**
   * helper method: create and sign a user operation.
   * @param info transaction details for the userOp
   */
  async createSignedUserOp(info: TransactionDetailsForUserOp): Promise<UserOperationStruct> {
    return await this.signUserOp(await this.createUnsignedUserOp(info))
  }

  private async _encodeOpCallData(info: TransactionDetailsForUserOp) {
    const value = BigNumber.from(info.value ?? 0)

    const callData = await this.encodeExecutionTransaction(info.target, value, info.data)
    const callGasLimit = await this.estimateGas({
      gasLimit: info.gasLimit,
      from: this.#entryPointContract.address,
      to: this.address,
      data: callData
    })
    return { callData, callGasLimit }
  }

  private async _encodeOpInitCallData() {
    const initCode = await this.encodeInitCode()
    const initGas = await this.estimateGas({
      from: this.#entryPointContract.address,
      to: this.#accountFactoryContract.address,
      data: '0x' + initCode.slice(42)
    })

    return { initCode, initGas }
  }

  /**
   * create a UserOperation, filling all details (except signature)
   * - if account is not yet created, add initCode to deploy it.
   * - if gas or nonce are missing, read them from the chain (note that we can't fill gaslimit before the account is created)
   * @param info
   */
  async createUnsignedUserOp(info: TransactionDetailsForUserOp): Promise<UserOperationStruct> {
    const { callData, callGasLimit } = await this._encodeOpCallData(info)
    const { initCode, initGas } = await this._encodeOpInitCallData()

    const verificationGasLimit = BigNumber.from(1e5).add(initGas)

    let { maxFeePerGas, maxPriorityFeePerGas } = info
    if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
      const feeData = await this.#provider.getFeeData()
      if (maxFeePerGas == null) {
        maxFeePerGas = feeData.maxFeePerGas ?? 0
      }
      if (maxPriorityFeePerGas == null) {
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 0
      }
    }

    const partialUserOp: Partial<UserOperationStruct> = {
      sender: this.address,
      nonce: this.getNonce(),
      initCode,
      callData,
      callGasLimit,
      verificationGasLimit,
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

  async encodeBatchExecutionTransaction(txs: TransactionRequest[]): Promise<string> {
    const accountContract = this.#accountContract
    const destinations = txs.map((tx) => tx.to ?? '')
    const callDatas = txs.map((tx) => tx.data ?? '0x00')
    return accountContract.interface.encodeFunctionData('executeBatch', [destinations, callDatas])
  }

  async encodeExecutionTransaction(
    target: string,
    value: BigNumberish,
    data: string
  ): Promise<string> {
    const accountContract = this.#accountContract
    return accountContract.interface.encodeFunctionData('execute', [target, value, data])
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
    await this.requireDeployed()

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

    return await this.#accountContract.execute(to, bigValue, data, {
      ...options
    })
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
    await this.requireDeployed()

    if (options?.gas && options?.gasLimit) {
      throw new Error('Cannot specify gas and gasLimit together in transaction options')
    }

    const destinations = txs.map((tx) => tx.to ?? '')
    const callDatas = txs.map((tx) => tx.data ?? '0x00')

    return await this.#accountContract.executeBatch(destinations, callDatas, {
      ...options
    })
  }
}
