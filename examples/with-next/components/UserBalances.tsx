import { useUserBalances } from '@/hooks/useBalances'
import { Currency } from '@/lib/type'
import { parseEther, parseUnits } from 'ethers/lib/utils.js'

type UserBalancesProps = {
  balances?: ReturnType<typeof useUserBalances>['balances']
  handleFaucetClick?: (token: Currency) => void
}

export const UserBalances = ({ balances, handleFaucetClick }: UserBalancesProps) => {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 items-center">
        <strong>ETH: </strong>
        <span>{balances?.ether?.formatted ?? '-'}</span>

        {!!balances?.ether && balances.ether.value.lt(parseEther('0.5')) && (
          <button
            className="capitalize inline-flex items-center rounded-md border border-transparent bg-pink-600 px-2 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            onClick={() => handleFaucetClick?.(Currency.ether)}
          >
            faucet
          </button>
        )}
      </div>
      <div className="flex gap-4 items-center">
        <strong>WETH: </strong>
        <span>{balances?.weth?.formatted ?? '-'}</span>

        {!!balances?.weth && balances.weth.value.lt(parseEther('0.5')) && (
          <button
            className="capitalize inline-flex items-center rounded-md border border-transparent bg-pink-600 px-2 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            onClick={() => handleFaucetClick?.(Currency.weth)}
          >
            faucet
          </button>
        )}
      </div>
      <div className="flex gap-4 items-center">
        <strong>USDT: </strong>
        <span>{balances?.usdt?.formatted ?? '-'}</span>

        {!!balances?.usdt && balances.usdt.value.lt(parseUnits('500', 8)) && (
          <button
            className="capitalize inline-flex items-center rounded-md border border-transparent bg-pink-600 px-2 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            onClick={() => handleFaucetClick?.(Currency.usdt)}
          >
            faucet
          </button>
        )}
      </div>
      <div className="flex gap-4 items-center">
        <strong>Custom Token: </strong>
        <span>{balances?.token?.formatted ?? '-'}</span>
        {balances?.token?.value && (
          <button
            className="capitalize inline-flex items-center rounded-md border border-transparent bg-pink-600 px-2 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            onClick={() => handleFaucetClick?.(Currency.token)}
          >
            faucet
          </button>
        )}
      </div>
    </div>
  )
}
