import { NextApiRequest, NextApiResponse } from 'next'
import { Wallet } from 'ethers'
// @ts-expect-error no typings for circomlibjs
import { eddsa, poseidon, smt } from 'circomlibjs'
import { generateSocialRecoveryProof } from '@/lib/proof'
import { PrivateRecoveryAccount__factory } from '@accountjs/sdk/dist/types'

const relayerAccount = new Wallet(process.env.PK!)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${method} Not Allowed`)
    return
  }

  const { oldOwner, scwAddress, newOwner, signature, publicKey } = body

  const accountContract = PrivateRecoveryAccount__factory.connect(scwAddress, relayerAccount)
  const guardians = await accountContract.getGuardians().then(xs => xs.map(x => x.toString())) as string[]
  const currentGuardianIndex = guardians.indexOf(publicKey)

  if (currentGuardianIndex < 0) {
    return res.status(401).json({
      error: {
        messaage: `Invalid public key: ${publicKey} is not not one of the guardian of ${scwAddress}`,
        code: 0x0
      },
    })
  }

  // Construct the original merkle tree
  const tree = await smt.newMemEmptyTrie()
  await tree.insert(oldOwner)
  // Insert guradians into the tree
  await Promise.all(guardians.map((guardPrv: string, i) => tree.insert(i + 1, eddsa.prv2pub(guardPrv))))

  const hashOfNewOwner = poseidon(newOwner)
  const txHashes = []

  const leaf = await tree.find(currentGuardianIndex)
  const { signal, proof } = await generateSocialRecoveryProof(
    leaf.siblings,
    publicKey,
    currentGuardianIndex,
    signature,
    hashOfNewOwner,
    tree.root
  )


  // Recover can be call from arbitrary eoa account
  const txResponse = await accountContract.connect(relayerAccount).recover(newOwner, proof.a, proof.b, proof.c, signal)
  txHashes.push(txResponse.hash)

  res.status(200).json({
    data: txHashes,
  })
}
