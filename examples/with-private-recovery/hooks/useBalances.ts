import { useCallback, useMemo } from 'react'
import { Address, useBalance } from 'wagmi'
import { LOCAL_CONFIG } from '@/config'

const { usdt, weth, tokenAddr } = LOCAL_CONFIG

// Get balances from user address
export function useUserBalances(givenAddress?: string) {
  const userAddress = givenAddress as Address | undefined

  const { data: etherBalance, refetch: refetchEther } = useBalance({
    address: userAddress,
    watch: true
  })
  const { data: wethBalance, refetch: refetchWeth } = useBalance({
    address: userAddress,
    token: weth,
    watch: true
  })
  const { data: usdtBalance, refetch: refetchUsdt } = useBalance({
    address: userAddress,
    token: usdt,
    watch: true
  })
  const { data: tokenBalance, refetch: refetchToken } = useBalance({
    address: userAddress,
    token: tokenAddr,
    watch: true
  })

  const updateBalances = useCallback(async () => {
    await Promise.all([refetchEther, refetchWeth, refetchUsdt, refetchToken])
  }, [refetchEther, refetchWeth, refetchUsdt, refetchToken])

  return useMemo(() => {
    const balances = {
      ether: etherBalance,
      weth: wethBalance,
      usdt: usdtBalance,
      token: tokenBalance
    }

    return {
      balances,
      updateBalances
    }
  }, [givenAddress, updateBalances, etherBalance, wethBalance, usdtBalance, tokenBalance])
}
