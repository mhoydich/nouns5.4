import { TezosToolkit, MichelsonMap } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { stringToBytes } from "@taquito/utils";

export function createTezosToolkit(rpcUrl) {
  return new TezosToolkit(rpcUrl);
}

export { BeaconWallet, MichelsonMap, stringToBytes };
