// @ts-expect-error no typing for this just yet
import { groth16 } from 'snarkjs'
import path from 'path'

// transform to solidity proof format
const packToSolidityProof = (proof: any) => {
  return [
    proof.pi_a[0],
    proof.pi_a[1],
    proof.pi_b[0][1],
    proof.pi_b[0][0],
    proof.pi_b[1][1],
    proof.pi_b[1][0],
    proof.pi_c[0],
    proof.pi_c[1]
  ]
}

// This method used fs, and can be only executed in nodejs enviroment
export const generateSocialRecoveryProof = async (
  siblings: any,
  pubKey: any,
  indexOfGuardian: any,
  sig: any,
  hashOfNewOwner: any,
  merkleRoot: any
) => {
  // depth of smt : 10
  const length = 10 - siblings.length
  for (let i = 0; i < length; i++) {
    siblings.push(BigInt(0))
  }

  const input = {
    siblings: siblings,
    pubKey: pubKey,
    indexOfGuardian: indexOfGuardian,
    sig: [sig.S, sig.R8[0], sig.R8[1]],
    hashOfNewOwner: hashOfNewOwner,
    merkleRoot: merkleRoot
  }

  const result = await groth16.fullProve(
    input,
    path.resolve('./static/SocialRecovery.wasm'),
    path.resolve('./static/SocialRecovery.zkey')
  )

  const proof = packToSolidityProof(result.proof)

  const a = [proof[0], proof[1]] as [string, string]
  const b = [
    [proof[2], proof[3]],
    [proof[4], proof[5]]
  ] as [[string, string], [string, string]]
  const c = [proof[6], proof[7]]as [string, string]

  return {
    signal: result.publicSignals,
    proof: {
      a,b,c
    }
  }
}
