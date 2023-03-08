import { BigNumber, BigNumberish, ethers } from 'ethers'
import { hexConcat, resolveProperties } from 'ethers/lib/utils'
import {
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse
} from '@ethersproject/abstract-provider'
import {
  SimpleAccountFactory,
  SimpleAccount,
  EntryPoint,
  UserOperationStruct
} from '@account-abstraction/contracts'
import {
  getAccountFactoryContract,
  getAccountContract,
  getEntryPointContract,
  ACCOUNT_FACTORY_ADDRESS
} from './utils/getContracts'
import { Address, ContractNetworkConfig } from './types'
import { calcPreVerificationGas, PreVerificationOp } from './utils/calcPreVerificationGas'

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
  dest: string
  value: BigNumberish
  data: string
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

  private async init({ signer, salt, contractNetwork }: AccountInitConfig): Promise<void> {
    signer._checkProvider()
    this.#signer = signer
    this.#provider = signer.provider!
    this.#salt = salt ?? (Date.now() * 1000 + Math.floor(Math.random() * 1000)).toString()
    this.chainId = await this.#provider.getNetwork().then((network) => network.chainId)

    // Assign before _computeAddress access the contract address
    this.#accountFactoryContract = await getAccountFactoryContract({
      provider: this.#provider,
      chainId: this.chainId,
      contractNetwork
    })

    this.#entryPointContract = await getEntryPointContract({
      provider: this.#provider,
      chainId: this.chainId,
      contractNetwork
    })

    const address = await this.getAddress()
    if (!address) {
      throw new Error('Unable to locate your account address')
    }
    this.address = address
    this.#accountContract = await getAccountContract({
      provider: this.#provider,
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

  // TODO: Change to deploy
  async activateAccount(callback?: (tx: TransactionReceipt) => void): Promise<void> {
    try {
      this.isActivating = true
      const accountAddress = this.address
      const op = await this.createUnsignedUserOp({
        target: accountAddress,
        data: '0x',
        value: 0,
        gasLimit: 100000
      })
      // This won't work unless change to entry point
      const tx = await this.#entryPointContract.handleOps([op], accountAddress)
      const txReceipt = await tx.wait()
      this.isDeployed = true
      this.isActivating = false
      callback?.(txReceipt)
    } catch (e) {
      this.isActivating = false
      throw e
    }
  }

  async getBatchExecutionTransaction(txs: TransactionRequest[]): Promise<string> {
    const accountContract = this.#accountContract
    const destinations = txs.map((tx) => tx.to ?? '')
    const callDatas = txs.map((tx) => tx.data ?? '0x00')
    return accountContract.interface.encodeFunctionData('executeBatch', [destinations, callDatas])
  }

  async getExecutionTransaction(
    target: string,
    value: BigNumberish,
    data: string
  ): Promise<string> {
    const accountContract = this.#accountContract
    return accountContract.interface.encodeFunctionData('execute', [target, value, data])
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

  async isAccountDeployed(): Promise<boolean> {
    if (!this.#signer.provider) {
      throw new Error('SDK not initialized')
    }
    const address = await this.getAddress()
    if (!address) {
      throw new Error('SDK not initialized')
    }
    const codeAtAddress = await this.#provider.getCode(address)
    const isDeployed = codeAtAddress !== '0x'
    return isDeployed
  }

  /**
   * Returns the Account nonce.
   *
   * @returns The Account nonce
   */
  async getNonce(): Promise<number> {
    return this.#accountContract.nonce().then((bn) => bn.toNumber())
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

  /**
   * create a UserOperation, filling all details (except signature)
   * - if account is not yet created, add initCode to deploy it.
   * - if gas or nonce are missing, read them from the chain (note that we can't fill gaslimit before the account is created)
   * @param info
   */
  async createUnsignedUserOp(info: TransactionDetailsForUserOp): Promise<UserOperationStruct> {
    const value = BigNumber.from(info.value ?? 0)
    const callData = await this.getExecutionTransaction(info.target, value, info.data)
    const callGasLimit = info.gasLimit
      ? BigNumber.from(info.gasLimit)
      : await this.#provider.estimateGas({
          from: this.#entryPointContract.address,
          to: this.address,
          data: callData
        })

    const initCode = await this.encodeInitCode()

    const initGas = await this.#provider.estimateGas({
      to: this.#accountFactoryContract.address,
      data: '0x' + initCode.slice(42)
    })
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
      paymasterAndData: '0x'
    }

    const op = (await resolveProperties(partialUserOp)) as PreVerificationOp

    // let paymasterAndData: string | undefined
    // if (this.paymasterAPI != null) {
    //   // fill (partial) preVerificationGas (all except the cost of the generated paymasterAndData)
    //   const userOpForPm = {
    //     ...partialUserOp,
    //     preVerificationGas: await this.getPreVerificationGas(partialUserOp)
    //   }
    //   paymasterAndData = await this.paymasterAPI.getPaymasterAndData(userOpForPm)
    // }
    // partialUserOp.paymasterAndData = paymasterAndData ?? '0x'
    return {
      ...partialUserOp,
      preVerificationGas: calcPreVerificationGas(op),
      signature: ''
    } as UserOperationStruct
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
    { value, dest, data }: ExecCallRequest,
    options?: TransactionOptions
  ): Promise<TransactionResponse> {
    const bValue = BigNumber.from(value)
    if (!bValue.isZero()) {
      const balance = await this.getBalance()
      if (bValue.gt(BigNumber.from(balance))) {
        throw new Error('Not enough Ether funds')
      }
    }

    if (options?.gas && options?.gasLimit) {
      throw new Error('Cannot specify gas and gasLimit together in transaction options')
    }

    const op = await this.createUnsignedUserOp({
      ...options,
      target: dest,
      data
    })

    const txResponse = await this.#entryPointContract.estimateGas.handleOps([op], this.address)
    // return txResponse
  }
}
