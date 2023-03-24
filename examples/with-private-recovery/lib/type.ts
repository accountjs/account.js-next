import { BigNumber } from "ethers"

export type Balance = {
  value: BigNumber
  formatted: string
  symbol: string
  decimals: number
}

export type Balances = {
  usdt?: Balance
  weth?: Balance
  ether?: Balance
  token?: Balance
}

export enum Currency {
  ether = "ether",
  weth = "weth",
  usdt = "usdt",
  token = "token",
}

export enum PaymasterMode {
  none = "simple",
  weth = "weth",
  usdt = "usdt",
  token = "token",
  gasless = "gasless",
}
