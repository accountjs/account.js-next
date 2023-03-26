// TODO: This config is for demonstration purpose, move it to .env file
export const LOCAL_CONFIG = {
  mnemonic: 'test test test test test test test test test test test junk',
  entryPoint: '0x0576a174D229E3cFA37253523E645A78A0C91B57',
  accountFactory: '0x7192244743491fcb3f8f682d57ab6e9e1f41de6e',
  accountForTokenFactory: '0xf25dc911d2c89559aeef1a49e36582f9cb305397',
  privateRecoveryAccountFactory: '0x9A676e781A523b5d0C0e43731313A708CB607508',
  poseidon: '0x68B1D87F95878fE05B998F19b66F4baba5De1aed',
  guardianVerifier: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
  socialRecoveryVerifier: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0',
  gaslessPaymaster: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  wethPaymaster: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  usdtPaymaster: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  fixedPaymaster: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
  weth: '0xd348692d37b02e9a63fa1cbd7832adc944d6ddd5',
  usdt: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  tokenAddr: '0x0f7a41bc01b661847d07077168c439abff37db8d',
  bundlerUrl: 'http://localhost:3000/rpc',
  providerUrl: 'http://localhost:8545'
} as const

export const GOERLI_CONFIG = {
  mnemonic: 'test test test test test test test test test test test junk',
  entryPoint: '0x9B20815493cC9790AbbbD3f90F2657cdEB227640',
  accountFactory: '0xA855A1fCF6Be1E16eF3a0115B01965e839b64E65',
  accountForTokenFactory: '0xe48c5a94cB4EA5FFcc1b682d82aED5019Bc63b84',
  wethPaymaster: '0x36F7466875Cb9614864406d0a353021f01266cB7',
  usdtPaymaster: '0x2694a7b6Fe37373581308dfA12757f7a0b603Be1',
  fixedPaymaster: '0x7500Aad545348099cbBf2F8B720701f41336008A',
  weth: '0xb63D63c12Db7af135165227a98aa13B008c92f8A',
  usdt: '0xC8cd2521A45B6133d134458CE43Def8587E309ea',
  tokenAddr: '0x9Fcfd091b0519775d572C59E37ead19870c49cdD',
  bundlerUrl: 'http://localhost:3000/rpc',
  providerUrl: 'http://localhost:8545'
} as const
