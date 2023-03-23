// interface PaymasterConfig {
//   paymasterEndpoint: string
//   key: string
// }

// export class PaymasterRelayer {
//   #paymasterEndpoint
//   #key

//   constructor({ paymasterEndpoint, key }: PaymasterConfig) {
//     this.#paymasterEndpoint = paymasterEndpoint
//     this.#key = key
//   }

//   async init(account) {
//     // ... await account.encodeFunctionData()
//     // ... approve
//   }

//   getPaymasterData(op) {
//     // send request with key to the endpoint
//     ky.get(this.#paymasterEndpoint, {
//       data: op.calldata,
//       target: op.sender
//     })
//   }
// }
