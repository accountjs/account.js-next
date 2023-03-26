import { parseEther, parseUnits } from 'ethers/lib/utils.js'
import { Address, erc20ABI } from 'wagmi'
import { fetchBalance, getContract, prepareWriteContract, writeContract } from 'wagmi/actions'
import { LOCAL_CONFIG } from '@/config'
import { admin } from './instances'
import { Currency } from './type'

const { usdt, weth, tokenAddr } = LOCAL_CONFIG

export const parseExpectedGas = (e: Error): Error => {
  // parse a custom error generated by the BundlerHelper, which gives a hint of how much payment is missing
  const match = e.message?.match(/paid (\d+) expected (\d+)/)
  if (match != null) {
    const paid = Math.floor(parseInt(match[1]) / 1e9)
    const expected = Math.floor(parseInt(match[2]) / 1e9)
    return new Error(
      `Error: Paid ${paid}, expected ${expected} . Paid ${Math.floor(
        (paid / expected) * 100
      )}%, missing ${expected - paid} `
    )
  }
  return e
}

export const faucet = async (address: Address, token?: Currency) => {
  const requiredBalance = parseEther('1')

  switch (token) {
    case Currency.ether: {
      const bal = await fetchBalance({ address })
      if (bal.value.lt(requiredBalance)) {
        await admin.sendTransaction({
          to: address,
          value: requiredBalance.sub(bal.value)
        })
      }
      break
    }
    case Currency.weth: {
      const bal = await fetchBalance({ address, token: weth })
      if (bal.value.lt(requiredBalance)) {
        const requiredAmount = requiredBalance.sub(bal.value)
        // wrap ETH to WETH
        await admin.sendTransaction({
          to: weth,
          value: requiredAmount
        })

        const config = await prepareWriteContract({
          address: weth,
          abi: erc20ABI,
          functionName: 'transfer',
          args: [address, requiredAmount],
          signer: admin
        })
        await writeContract(config).then((tx) => tx.wait())
      }
      break
    }
    case Currency.usdt: {
      const requiredUSD = parseUnits('50000', 8)
      const bal = await fetchBalance({ address, token: usdt })
      if (bal.value.lt(requiredUSD)) {
        const config = await prepareWriteContract({
          address: usdt,
          abi: erc20ABI,
          functionName: 'transfer',
          args: [address, requiredUSD.sub(bal.value)],
          signer: admin
        })
        await writeContract(config).then((tx) => tx.wait())
      }
      break
    }
    case Currency.token: {
      const requiredTok = parseEther('1')
      const ERC20Token = getContract({
        address: tokenAddr,
        abi: [
          ...erc20ABI,
          {
            inputs: [
              {
                internalType: 'address',
                name: 'sender',
                type: 'address'
              },
              {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256'
              }
            ],
            name: 'mint',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function'
          }
        ] as const,
        signerOrProvider: admin
      })
      const args = [admin.address as Address, parseEther('1')] as const
      const estimateGas = await ERC20Token.estimateGas.mint(...args)
      await ERC20Token.mint(...args, { gasLimit: estimateGas.mul(3).div(2) }).catch((e) =>
        console.log(e)
      )
      await ERC20Token.transfer(address, requiredTok).then((tx) => tx.wait())
      break
    }
    default: {
      throw new Error('Unknown token')
    }
  }
}