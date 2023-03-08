export type PromiseOrValue<T> = T | Promise<T>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Address = `0x${string}`

export interface ContractNetworkConfig {
  accountFactoryAddress: string
  entryPointAddress: string
}
