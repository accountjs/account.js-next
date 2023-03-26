import type { UserOperationStruct } from '@account-abstraction/contracts'
import { deepHexlify, getEntryPointContract } from '@accountjs/sdk'
import type { EntryPoint as EntryPointContract } from '@accountjs/sdk/dist/types'
import type { ContractReceipt, ContractTransaction } from 'ethers'
import { BigNumber, providers } from 'ethers'

import { hexValue, resolveProperties } from 'ethers/lib/utils'
import ky from 'ky'

interface ServiceClientCreateConfig {
  chainId: number
  // TODO: Make it optional, defaults to a selective bundler node
  bundlerUrl: string
  // TODO: Make it optional, defaults to official infinitism entry point contract,
  // also see https://github.com/eth-infinitism/bundler/blob/main/packages/bundler/localconfig/bundler.config.json#L5
  entryPointAddress: string
}

export class ServiceClient {
  #chainId!: number
  #bundlerUrl!: string
  #entryPointAddress!: string
  #entryPoint!: EntryPointContract

  constructor({ chainId, bundlerUrl, entryPointAddress }: ServiceClientCreateConfig) {
    this.#chainId = chainId
    this.#bundlerUrl = bundlerUrl
    this.#entryPointAddress = entryPointAddress
    this.#entryPoint = getEntryPointContract({
      chainId,
      customContracts: { entryPointAddress },
      signerOrProvider: new providers.JsonRpcProvider(bundlerUrl)
    })
  }

  // Given a signed user op, return a transaction response
  async sendUserOp(signedOp: UserOperationStruct): Promise<ContractTransaction> {
    const hexifiedUserOp = deepHexlify(await resolveProperties(signedOp))
    const jsonRequestData: [UserOperationStruct, string] = [hexifiedUserOp, this.#entryPointAddress]

    const response = await ky.post(this.#bundlerUrl, {
      method: 'post',
      json: {
        method: 'eth_sendUserOperation',
        params: jsonRequestData,
        jsonrpc: '2.0'
      }
    })
    const json = await response.json<{ result: string }>()
    // return hash result
    const userOpHash = json.result
    const userOp = await resolveProperties(signedOp)
    // const waitPromise = new Promise<ContractReceipt>((resolve, reject) => {
    //   setTimeout(async () => {
    //     try {
    //       const events = await this.#entryPoint.queryFilter(
    //         this.#entryPoint.filters.UserOperationEvent(userOpHash)
    //       )
    //       const receipt = await events[0].getTransactionReceipt()
    //       resolve(receipt)
    //     } catch (error) {
    //       reject(error)
    //     }
    //   }, 100)
    // })

    return {
      hash: userOpHash,
      confirmations: 0,
      from: userOp.sender,
      nonce: BigNumber.from(userOp.nonce).toNumber(),
      gasLimit: BigNumber.from(userOp.callGasLimit), // ??
      value: BigNumber.from(0),
      data: hexValue(userOp.callData), // should extract the actual called method from this "execFromEntryPoint()" call
      chainId: this.#chainId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async wait(_?: number) {
        return null as any
      }
      // wait: async (_?: number): Promise<ContractReceipt> => {
      //   const transactionReceipt = await waitPromise
      //   return transactionReceipt
      // }
    }
  }
}
