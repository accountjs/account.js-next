import { Dispatch, SetStateAction, useState } from "react"
import useEvent from "react-use-event-hook"

type Value<T> = T | ((preValue: T) => T)

export const noop = () => {}
export const isBrowser = typeof window !== "undefined"

export function useLocalStorage<T>(
  key: string,
  initialValue?: Value<T>,
): [T | undefined, Dispatch<SetStateAction<T | undefined>>, () => void] {
  if (!isBrowser) {
    return [initialValue as T, noop, noop]
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [state, setState] = useState<T | undefined>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.log("💣 ~ useLocalStorage error", error)
      return initialValue
    }
  })

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const set = useEvent<Dispatch<SetStateAction<T | undefined>>>((valOrFunc) => {
    try {
      const valueToStore =
        typeof valOrFunc === "function"
          ? (valOrFunc as Function)(state)
          : valOrFunc
      setState(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      // If user is in private mode or has storage restriction
      // localStorage can throw. Also JSON.stringify can throw.
    }
  })

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const remove = useEvent(() => {
    try {
      localStorage.removeItem(key)
      setState(undefined)
    } catch {
      // If user is in private mode or has storage restriction
      // localStorage can throw.
    }
  })
  return [state, set, remove]
}
