import { TezosToolkit, MichelsonMap } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { stringToBytes } from "@taquito/utils";
import { PostMessageTransport } from "@ecadlabs/beacon-transport-postmessage";

export function createTezosToolkit(rpcUrl) {
  return new TezosToolkit(rpcUrl);
}

export function createTezosWallet(options) {
  return new BeaconWallet({
    ...options,
    colorMode: options.colorMode || "light",
    preferredNetwork: options.preferredNetwork || options.network?.type,
  });
}

export async function detectTezosExtensions() {
  try {
    const extensions = await PostMessageTransport.getAvailableExtensions();
    return Array.isArray(extensions) ? extensions : [];
  } catch {
    return [];
  }
}

export async function getActiveWalletAccount(wallet) {
  if (!wallet?.client?.getActiveAccount) {
    return null;
  }

  return wallet.client.getActiveAccount();
}

export async function disconnectTezosWallet(wallet) {
  if (!wallet?.disconnect) {
    return;
  }

  await wallet.disconnect();
}

export { MichelsonMap, stringToBytes };
