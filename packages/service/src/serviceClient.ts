import type { UserOperationStruct } from '@account-abstraction/contracts'
import { deepHexlify, getEntryPointContract } from '@accountjs/sdk'
import { EntryPoint as EntryPointContract } from '@accountjs/sdk/dist/types'
import { BigNumber, ContractReceipt, ContractTransaction, Event, providers } from 'ethers'

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

const resolveCallback = async (
  event: Event,
  userOpHash: string,
  resolve: (t: ContractReceipt) => void,
  reject: (reason: string) => unknown
): Promise<void> => {
  if (event.args == null) {
    console.error('got event without args', event)
    return
  }
  if (event.args.userOpHash !== userOpHash) {
    return
  }

  const transactionReceipt = await event.getTransactionReceipt()
  transactionReceipt.transactionHash = userOpHash

  // before returning the receipt, update the status from the event.
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!event.args.success) {
    await reject('UserOp failed')
  }
  resolve(transactionReceipt)
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
    const waitPromise = new Promise<ContractReceipt>((resolve, reject) => {
      const filter = this.#entryPoint.filters.UserOperationEvent(userOpHash)
      // listener takes time... first query directly:
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setTimeout(async () => {
        const res = await this.#entryPoint.queryFilter(filter, 'latest')
        if (res.length > 0) {
          resolveCallback(res[0], userOpHash, resolve, reject)
        } else {
          this.#entryPoint.once(filter, (events: any) => {
            resolveCallback(events[events.length - 1], userOpHash, resolve, reject)
          })
        }
      }, 100)
    })

    return {
      hash: userOpHash,
      confirmations: 0,
      from: userOp.sender,
      nonce: BigNumber.from(userOp.nonce).toNumber(),
      gasLimit: BigNumber.from(userOp.callGasLimit), // ??
      value: BigNumber.from(0),
      data: hexValue(userOp.callData), // should extract the actual called method from this "execFromEntryPoint()" call
      chainId: this.#chainId,
      wait: async (_?: number): Promise<ContractReceipt> => {
        const transactionReceipt = await waitPromise
        return transactionReceipt
      }
    }
  }
}
