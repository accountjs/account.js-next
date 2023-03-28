import { NextApiRequest, NextApiResponse } from 'next'
import { Wallet } from 'ethers'
// @ts-expect-error no typings for circomlibjs
import { poseidon, smt, eddsa } from 'circomlibjs'
import { generateSocialRecoveryProof } from '@/lib/proof'
import { PrivateRecoveryAccount__factory } from '@accountjs/sdk/dist/types'
import { provider } from '@/lib/instances'

const relayerAccount = new Wallet(
  process.env.RELAYER_PK! ?? "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
).connect(provider)

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

  const { oldOwner, account, newOwner, privateKey } = JSON.parse(body) as {
    oldOwner: string, account: string, newOwner: string, privateKey: string
  }
  const publicKeyPair = eddsa.prv2pub(privateKey)
  const publicKey = publicKeyPair[0]
  const hashOfNewOwner = poseidon([newOwner.toLowerCase()])
  const signature = eddsa.signMiMC(privateKey, hashOfNewOwner);

  const accountContract = PrivateRecoveryAccount__factory.connect(account, relayerAccount)

  const guardians = await accountContract.getGuardians().then(xs => xs.map(x => x.toBigInt())) as BigInt[]
  const currentGuardianIndex = guardians.indexOf(publicKey)

  if (currentGuardianIndex < 0) {
    return res.status(401).json({
      error: {
        message: `Invalid public key: ${publicKey} is not not one of the guardian of ${account}`,
        code: 0x0
      },
    })
  }

  // Construct the original merkle tree
  const tree = await smt.newMemEmptyTrie()
  await tree.insert(0, oldOwner.toLowerCase())

  // Insert guradians into the tree oldOwner
  await tree.insert(1, guardians[0]);
  await tree.insert(2, guardians[1]);
  await tree.insert(3, guardians[2]);
  const leaf = await tree.find(currentGuardianIndex + 1)  // plus one because of the root

  const { signal, proof } = await generateSocialRecoveryProof(
    leaf.siblings,
    publicKeyPair,
    currentGuardianIndex + 1,  // plus one because of the root
    signature,
    hashOfNewOwner,
    tree.root
  )

  // Recover can be call from arbitrary eoa account
  const txResponse = await accountContract.connect(relayerAccount).recover(newOwner, proof.a, proof.b, proof.c, signal)
  res.status(200).json({
    data: txResponse,
  })
}
