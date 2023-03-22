import { useEffect, useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import useEvent from 'react-use-event-hook'
import { Address, useAccount } from 'wagmi'
import { parseExpectedGas } from '@/lib/helper'
import { Balances, PaymasterMode } from '@/lib/type'

export const useAccountAbstractionAccount = (paymasterMode = PaymasterMode.none) => {
  const { isConnected, address: eoaAddress } = useAccount()
  const [balances, setBalances] = useState<Balances>()
  const [address, setAddress] = useState<Address>()
  const [hasDeployed, setHasDeployed] = useState(false)
  const [isActivatingAccount, setIsActivatingAccount] = useState(false)
  // const [aaProvider, setAAProvider] = useState<ERC4337EthersProvider>()

  // const updateCurrUserBalances = useEvent(async () => {
  //   if (!address) {
  //     return
  //   }
  //   const balances = await getUserBalances(address)
  //   setBalances(balances)
  // })

  // Activate account
  // const activateAccount = async () => {
  //   if (!address || !aaProvider) {
  //     return
  //   }

  //   try {
  //     setIsActivatingAccount(true)
  //     const tx = await aaProvider.getSigner().sendTransaction({
  //       to: address,
  //       value: 0,
  //       gasLimit: 100000
  //     })
  //     await tx.wait()
  //     // await updateCurrUserBalances()
  //     setHasDeployed(true)
  //   } catch (e) {
  //     const error = parseExpectedGas(e as Error)
  //     console.log(error)
  //     // We can get error from transaction
  //   }
  //   setIsActivatingAccount(false)
  // }

  // const getUserAddress = useEvent(async () => {
  //   if (!privateKey) {
  //     return
  //   }
  //   const factoryInterface =
  //     SimpleAccountForTokensFactory__factory.createInterface()
  //   const owner = new Wallet(privateKey)
  //   const initCode = hexConcat([
  //     accountForTokenFactory,
  //     factoryInterface.encodeFunctionData("createAccount", [
  //       await owner.getAddress(),
  //       weth,
  //       wethPaymaster,
  //       0,
  //     ]),
  //   ])

  //   try {
  //     await EntryPoint__factory.connect(
  //       entryPoint,
  //       provider,
  //     ).callStatic.getSenderAddress(initCode)
  //   } catch (e) {
  //     const error = e as { errorArgs?: { sender?: Address } } | undefined
  //     if (error?.errorArgs?.sender) {
  //       return error?.errorArgs?.sender
  //     }
  //   }
  // })

  // Update balances on address changed
  // useEffect(() => {
  //   ;(async () => {
  //     await updateCurrUserBalances()
  //     // console.log(await getUserAddress())
  //   })()
  // }, [updateCurrUserBalances, address])

  // useEffect(() => {
  //   if (!isConnected) {
  //     return
  //   }

  //   ;(async () => {
  //     const newAAProvider = await getAAProvider(paymasterMode, ownerWallet)
  //     const newAddress = (await newAAProvider.getSenderAccountAddress()) as Address
  //     const isPhantom = await newAAProvider.smartAccountAPI.checkAccountPhantom()

  //     unstable_batchedUpdates(() => {
  //       setAddress(newAddress)
  //       setAAProvider(newAAProvider)
  //       setHasDeployed(!isPhantom)
  //     })
  //   })()
  // }, [paymasterMode, updateCurrUserBalances])

  // return {
  //   eoaAddress,
  //   address,
  //   balances,
  //   hasDeployed,
  //   isActivatingAccount,
  //   aaProvider,
  //   // Methods
  //   activateAccount,
  //   updateCurrUserBalances
  // }
}
