import { ethers } from 'ethers'
import { defaultAbiCoder, hexlify, keccak256, resolveProperties } from 'ethers/lib/utils'
import type { Deferrable, ParamType } from 'ethers/lib/utils'
import type { UserOperationStruct } from '@account-abstraction/contracts'
import type { PreVerificationOp } from './calcPreVerificationGas'
import type { NotPromise } from '../types'
import { Account__factory } from '../../types'

// UserOperation is the first parameter of validateUseOp
const UserOpType = {
  components: [
    {
      internalType: 'address',
      name: 'sender',
      type: 'address'
    },
    {
      internalType: 'uint256',
      name: 'nonce',
      type: 'uint256'
    },
    {
      internalType: 'bytes',
      name: 'initCode',
      type: 'bytes'
    },
    {
      internalType: 'bytes',
      name: 'callData',
      type: 'bytes'
    },
    {
      internalType: 'uint256',
      name: 'callGasLimit',
      type: 'uint256'
    },
    {
      internalType: 'uint256',
      name: 'verificationGasLimit',
      type: 'uint256'
    },
    {
      internalType: 'uint256',
      name: 'preVerificationGas',
      type: 'uint256'
    },
    {
      internalType: 'uint256',
      name: 'maxFeePerGas',
      type: 'uint256'
    },
    {
      internalType: 'uint256',
      name: 'maxPriorityFeePerGas',
      type: 'uint256'
    },
    {
      internalType: 'bytes',
      name: 'paymasterAndData',
      type: 'bytes'
    },
    {
      internalType: 'bytes',
      name: 'signature',
      type: 'bytes'
    }
  ],
  internalType: 'struct UserOperation',
  name: 'userOp',
  type: 'tuple'
} as const

export const AddressZero = ethers.constants.AddressZero

/**
 * calculate the userOpHash of a given userOperation.
 * The userOpHash is a hash of all UserOperation fields, except the "signature" field.
 * The entryPoint uses this value in the emitted UserOperationEvent.
 * A wallet may use this value as the hash to sign (the SampleWallet uses this method)
 * @param op
 * @param entryPoint
 * @param chainId
 */
export function getUserOpHash(
  op: NotPromise<UserOperationStruct>,
  entryPoint: string,
  chainId: number
): string {
  const userOpHash = keccak256(packUserOp(op, true))
  const enc = defaultAbiCoder.encode(
    ['bytes32', 'address', 'uint256'],
    [userOpHash, entryPoint, chainId]
  )
  return keccak256(enc)
}

function encode(typevalues: Array<{ type: string; val: any }>, forSignature: boolean): string {
  const types = typevalues.map((typevalue) =>
    typevalue.type === 'bytes' && forSignature ? 'bytes32' : typevalue.type
  )
  const values = typevalues.map((typevalue) =>
    typevalue.type === 'bytes' && forSignature ? keccak256(typevalue.val) : typevalue.val
  )
  return defaultAbiCoder.encode(types, values)
}

/**
 * pack the userOperation
 * @param op
 * @param forSignature "true" if the hash is needed to calculate the getUserOpHash()
 *  "false" to pack entire UserOp, for calculating the calldata cost of putting it on-chain.
 */
export function packUserOp(
  op: NotPromise<UserOperationStruct> | PreVerificationOp,
  forSignature = true
): string {
  if (forSignature) {
    // lighter signature scheme (must match UserOperation#pack): do encode a zero-length signature, but strip afterwards the appended zero-length value
    const userOpType = {
      components: [
        {
          type: 'address',
          name: 'sender'
        },
        {
          type: 'uint256',
          name: 'nonce'
        },
        {
          type: 'bytes',
          name: 'initCode'
        },
        {
          type: 'bytes',
          name: 'callData'
        },
        {
          type: 'uint256',
          name: 'callGasLimit'
        },
        {
          type: 'uint256',
          name: 'verificationGasLimit'
        },
        {
          type: 'uint256',
          name: 'preVerificationGas'
        },
        {
          type: 'uint256',
          name: 'maxFeePerGas'
        },
        {
          type: 'uint256',
          name: 'maxPriorityFeePerGas'
        },
        {
          type: 'bytes',
          name: 'paymasterAndData'
        },
        {
          type: 'bytes',
          name: 'signature'
        }
      ],
      name: 'userOp',
      type: 'tuple'
    } as ParamType

    let encoded = defaultAbiCoder.encode(
      [userOpType],
      [
        {
          ...op,
          signature: '0x'
        }
      ]
    )
    // remove leading word (total length) and trailing word (zero-length signature)
    encoded = '0x' + encoded.slice(66, encoded.length - 64)
    return encoded
  }

  const typevalues = UserOpType.components.map(
    (c: { name: keyof UserOperationStruct; type: string }) => ({
      type: c.type,
      val: op[c.name]
    })
  )
  return encode(typevalues, forSignature)
}

/**
 * hexlify all members of object, recursively
 * @param obj
 */
export function deepHexlify(obj: any): any {
  if (typeof obj === 'function') {
    return undefined
  }
  if (obj == null || typeof obj === 'string' || typeof obj === 'boolean') {
    return obj
  } else if (obj._isBigNumber != null || typeof obj !== 'object') {
    return hexlify(obj).replace(/^0x0/, '0x')
  }
  if (Array.isArray(obj)) {
    return obj.map((member) => deepHexlify(member))
  }
  return Object.keys(obj).reduce(
    (set, key) => ({
      ...set,
      [key]: deepHexlify(obj[key])
    }),
    {}
  )
}

// resolve all property and hexlify.
// (UserOpMethodHandler receives data from the network, so we need to pack our generated values)
export async function resolveHexlify<T>(a: Readonly<Deferrable<T>>): Promise<T> {
  return deepHexlify(await resolveProperties(a))
}

export function isExecuteBatchTransaction(data: string) {
  try {
    const simpleAccountInterface = Account__factory.createInterface()
    const parsedTx = simpleAccountInterface.parseTransaction({ data })

    return (
      parsedTx.name === 'executeBatch' && parsedTx.signature === 'executeBatch(address[],bytes[])',
      parsedTx.args.hasOwnProperty('dest') &&
        parsedTx.args.hasOwnProperty('func') &&
        Array.isArray(parsedTx.args)
    )
  } catch {
    return false
  }
}
