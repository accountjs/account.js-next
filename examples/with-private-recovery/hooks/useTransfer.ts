import { Address } from "wagmi"
import useEvent from "react-use-event-hook"
import { ERC4337EthersProvider } from "@aa-lib/sdk"
import { Currency } from "@/lib/type"
import { transfer } from "@/lib/helper"

export const useTransfer = (provider?: ERC4337EthersProvider) => {
  return useEvent((currency: Currency, target: Address, amount: string) => {
    if (!provider) {
      return
    }

    return transfer(currency, target, amount, provider)
  })
}
