import { groth16 } from 'snarkjs'

const generateSocialRecoveryProof = async (
  siblings,
  pubKey,
  indexOfGuardian,
  sig,
  hashOfNewOwner,
  merkleRoot
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
    '../../statics/SocialRecovery.wasm',
    '../../statics/SocialRecovery.zkey'
  )

  return {
    public: result.publicSignals,
    proof: packToSolidityProof(result.proof)
  }
}

// transform to solidity proof format
function packToSolidityProof(proof) {
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

export default function handler(req, res) {
  res.status(200).json({ name: 'John Doe' })
}
