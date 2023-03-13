import { useEffect, useReducer } from 'react'

export function useIsMounted() {
  const [mounted, mount] = useReducer(() => true, false)
  useEffect(mount, [mount])
  return mounted
}
