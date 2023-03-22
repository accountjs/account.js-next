import type { UserOperationStruct } from '@account-abstraction/contracts'
import { deepHexlify } from '@accountjs/sdk'
import { resolveProperties } from 'ethers/lib/utils'
import ky from 'ky'

interface ServiceClientCreateConfig {
  // TODO: Allow hex string
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

  constructor({ chainId, bundlerUrl, entryPointAddress }: ServiceClientCreateConfig) {
    this.#bundlerUrl = bundlerUrl
    this.#chainId = chainId
    this.#entryPointAddress = entryPointAddress
  }

  async sendUserOp(signedOp: UserOperationStruct) {
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
    return json.result
  }
}
