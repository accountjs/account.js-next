/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../common";

export interface TestAccountFactoryInterface extends utils.Interface {
  functions: {
    "accountImplementation()": FunctionFragment;
    "createAccount(address,uint256)": FunctionFragment;
    "getAddress(address,uint256)": FunctionFragment;
    "getBytes32Salt(uint256)": FunctionFragment;
    "getCreationCode()": FunctionFragment;
    "getDeploymentData(address)": FunctionFragment;
    "getDeploymentDataSig(address)": FunctionFragment;
    "getInitCode(address)": FunctionFragment;
    "getInitSig(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "accountImplementation"
      | "createAccount"
      | "getAddress"
      | "getBytes32Salt"
      | "getCreationCode"
      | "getDeploymentData"
      | "getDeploymentDataSig"
      | "getInitCode"
      | "getInitSig"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "accountImplementation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "createAccount",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getAddress",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getBytes32Salt",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getCreationCode",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getDeploymentData",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getDeploymentDataSig",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getInitCode",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getInitSig",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "accountImplementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createAccount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getAddress", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getBytes32Salt",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getCreationCode",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDeploymentData",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDeploymentDataSig",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getInitCode",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getInitSig", data: BytesLike): Result;

  events: {};
}

export interface TestAccountFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: TestAccountFactoryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    accountImplementation(overrides?: CallOverrides): Promise<[string]>;

    createAccount(
      owner: PromiseOrValue<string>,
      salt: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getAddress(
      owner: PromiseOrValue<string>,
      salt: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getBytes32Salt(
      salt: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getCreationCode(overrides?: CallOverrides): Promise<[string]>;

    getDeploymentData(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getDeploymentDataSig(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getInitCode(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getInitSig(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;
  };

  accountImplementation(overrides?: CallOverrides): Promise<string>;

  createAccount(
    owner: PromiseOrValue<string>,
    salt: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getAddress(
    owner: PromiseOrValue<string>,
    salt: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  getBytes32Salt(
    salt: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  getCreationCode(overrides?: CallOverrides): Promise<string>;

  getDeploymentData(
    owner: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  getDeploymentDataSig(
    owner: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  getInitCode(
    owner: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  getInitSig(
    owner: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  callStatic: {
    accountImplementation(overrides?: CallOverrides): Promise<string>;

    createAccount(
      owner: PromiseOrValue<string>,
      salt: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    getAddress(
      owner: PromiseOrValue<string>,
      salt: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    getBytes32Salt(
      salt: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    getCreationCode(overrides?: CallOverrides): Promise<string>;

    getDeploymentData(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    getDeploymentDataSig(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    getInitCode(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    getInitSig(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {};

  estimateGas: {
    accountImplementation(overrides?: CallOverrides): Promise<BigNumber>;

    createAccount(
      owner: PromiseOrValue<string>,
      salt: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getAddress(
      owner: PromiseOrValue<string>,
      salt: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getBytes32Salt(
      salt: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getCreationCode(overrides?: CallOverrides): Promise<BigNumber>;

    getDeploymentData(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDeploymentDataSig(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getInitCode(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getInitSig(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    accountImplementation(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    createAccount(
      owner: PromiseOrValue<string>,
      salt: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getAddress(
      owner: PromiseOrValue<string>,
      salt: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getBytes32Salt(
      salt: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getCreationCode(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getDeploymentData(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDeploymentDataSig(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getInitCode(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getInitSig(
      owner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
