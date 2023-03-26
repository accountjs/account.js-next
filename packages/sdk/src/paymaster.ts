import type { Signer } from 'ethers'
import { defaultAbiCoder, keccak256, hexlify, resolveProperties, arrayify } from 'ethers/lib/utils'
import type { UserOperationStruct } from '@account-abstraction/contracts'

export abstract class Paymaster {
  /**
   * @param userOp a partially-filled UserOperation (without signature and paymasterAndData
   *  note that the "preVerificationGas" is incomplete: it can't account for the
   *  paymasterAndData value, which will only be returned by this method..
   * @returns the value to put into the PaymasterAndData, undefined to leave it empty
   */
  abstract getPaymasterAndData(userOp: Partial<UserOperationStruct>): Promise<string | undefined>

  abstract getPaymasterToken(): Promise<string | undefined>

  abstract getPaymasterAddress(): Promise<string>
}

export class TokenPaymaster extends Paymaster {
  #paymasterAddress!: string
  #tokenAddress!: string

  constructor(readonly _paymasterAddress: string, readonly _tokenAddress: string) {
    super()
    this.#paymasterAddress = _paymasterAddress
    this.#tokenAddress = _tokenAddress
  }
  /**
   * @param userOp a partially-filled UserOperation (without signature and paymasterAndData
   *  note that the "preVerificationGas" is incomplete: it can't account for the
   *  paymasterAndData value, which will only be returned by this method..
   * @returns the value to put into the PaymasterAndData, undefined to leave it empty
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPaymasterAndData(_: Partial<UserOperationStruct>): Promise<string | undefined> {
    return this.#paymasterAddress
  }

  async getPaymasterToken(): Promise<string | undefined> {
    return this.#tokenAddress
  }

  async getPaymasterAddress(): Promise<string> {
    return this.#paymasterAddress
  }
}

export class VerifyingPaymaster extends Paymaster {
  #paymasterAddress!: string
  #signer!: Signer

  constructor(readonly _paymasterAddress: string, readonly _signer: Signer) {
    super()
    this.#paymasterAddress = _paymasterAddress
    this.#signer = _signer
  }

  async getPaymasterAndData(userOp: UserOperationStruct): Promise<string | undefined> {
    const hash = await this.verifyOp(userOp)
    const sig = await this.#signer.signMessage(arrayify(hash))
    return this.#paymasterAddress + sig.substring(2)
  }

  async getPaymasterToken(): Promise<string | undefined> {
    return undefined
  }

  async getPaymasterAddress(): Promise<string> {
    return this.#paymasterAddress
  }

  async verifyOp(userOp1: UserOperationStruct): Promise<string> {
    const userOp = await resolveProperties(userOp1)
    const enc = defaultAbiCoder.encode(
      [
        'address',
        'uint256',
        'bytes32',
        'bytes32',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'uint256'
      ],
      [
        userOp.sender,
        userOp.nonce,
        keccak256(hexlify(userOp.initCode)),
        keccak256(hexlify(userOp.callData)),
        userOp.callGasLimit,
        userOp.verificationGasLimit,
        userOp.preVerificationGas,
        userOp.maxFeePerGas,
        userOp.maxPriorityFeePerGas
      ]
    )
    return keccak256(enc)
  }
}
