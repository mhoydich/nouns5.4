import { TezosToolkit, MichelsonMap } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { stringToBytes } from "@taquito/utils";
import {
  Client as BeaconBaseClient,
  PostMessageTransport,
  StorageKey,
  TransportStatus,
  getDAppClientInstance,
  getKeypairFromSeed,
} from "@ecadlabs/beacon-dapp";

const EXTENSION_PRIORITY = ["temple", "kukai", "umami", "metamask"];

class ExtensionOnlyPostMessageTransport extends PostMessageTransport {
  async startOpenChannelListener() {
    return this.client.listenForChannelOpening(async (peer) => {
      await this.addPeer(peer);
      this._isConnected = TransportStatus.CONNECTED;

      if (this.newPeerListener) {
        this.newPeerListener(peer);
        this.newPeerListener = undefined;
      }
    });
  }

  async listenForNewPeer(newPeerListener) {
    this.newPeerListener = newPeerListener;
  }

  async stopListeningForNewPeers() {
    this.newPeerListener = undefined;
  }
}

function pickPreferredExtension(extensions, lastSelectedWallet) {
  const normalizedLastSelected = String(
    lastSelectedWallet?.name || lastSelectedWallet?.key || "",
  ).toLowerCase();

  if (normalizedLastSelected) {
    const exactMatch = extensions.find((extension) =>
      extension.name?.toLowerCase().includes(normalizedLastSelected),
    );

    if (exactMatch) {
      return exactMatch;
    }
  }

  for (const preferredName of EXTENSION_PRIORITY) {
    const preferredExtension = extensions.find((extension) =>
      extension.name?.toLowerCase().includes(preferredName),
    );

    if (preferredExtension) {
      return preferredExtension;
    }
  }

  return extensions[0];
}

function patchClientForExtensions(client) {
  if (client.__industryNextExtensionPatched) {
    return client;
  }

  client.__industryNextExtensionPatched = true;

  client.initInternalTransports = async function initInternalTransports() {
    const seed = await this.storage.get(StorageKey.BEACON_SDK_SECRET_SEED);

    if (!seed) {
      throw new Error("Secret seed not found.");
    }

    if (this.postMessageTransport) {
      return;
    }

    const keyPair = await getKeypairFromSeed(seed);
    this.postMessageTransport = new ExtensionOnlyPostMessageTransport(
      this.name,
      keyPair,
      this.storage,
      StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP,
    );
    await this.addListener(this.postMessageTransport);
  };

  client.init = async function init(transport) {
    if (this._initPromise) {
      return this._initPromise;
    }

    try {
      await this.activeAccountLoaded;
    } catch {
      // Ignore storage recovery issues and let the connect flow continue cleanly.
    }

    this._initPromise = new Promise(async (resolve, reject) => {
      const fail = (error) => {
        this._initPromise = undefined;
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      try {
        if (transport) {
          await this.addListener(transport);
          resolve(await BeaconBaseClient.prototype.init.call(this, transport));
          return;
        }

        if (this._transport.isSettled()) {
          const currentTransport = await this.transport;
          await currentTransport.connect();
          resolve(await BeaconBaseClient.prototype.init.call(this, currentTransport));
          return;
        }

        const activeAccount = await this.getActiveAccount();
        await this.initInternalTransports();

        if (!this.postMessageTransport) {
          fail(new Error("Browser wallet transport unavailable."));
          return;
        }

        await this.postMessageTransport.connect();

        if (activeAccount?.origin?.type === "extension") {
          resolve(await BeaconBaseClient.prototype.init.call(this, this.postMessageTransport));
          return;
        }

        const availableExtensions = await PostMessageTransport.getAvailableExtensions();

        if (!availableExtensions.length) {
          fail(
            new Error(
              "No Beacon-compatible browser wallet detected. Install or unlock Temple, Kukai, or another Tezos extension and try again.",
            ),
          );
          return;
        }

        const lastSelectedWallet = await this.storage.get(StorageKey.LAST_SELECTED_WALLET);
        const selectedExtension = pickPreferredExtension(
          availableExtensions,
          lastSelectedWallet,
        );

        if (!selectedExtension?.id) {
          fail(new Error("Could not determine which wallet extension to open."));
          return;
        }

        await this.storage.set(StorageKey.LAST_SELECTED_WALLET, {
          icon: selectedExtension.iconURL ?? "",
          key: selectedExtension.name,
          name: selectedExtension.name,
          type: "extension",
        });

        let pairingResolved = false;
        const timeoutId = window.setTimeout(async () => {
          if (pairingResolved) {
            return;
          }

          pairingResolved = true;
          await this.postMessageTransport?.stopListeningForNewPeers().catch(() => {});
          fail(
            new Error(
              `Could not establish a wallet channel with ${selectedExtension.name}. Unlock the extension, approve the pairing request, and try again.`,
            ),
          );
        }, 12000);

        await this.postMessageTransport.listenForNewPeer(async (peer) => {
          if (pairingResolved) {
            return;
          }

          pairingResolved = true;
          window.clearTimeout(timeoutId);

          try {
            await this.setActivePeer(peer);
            await this.setTransport(this.postMessageTransport);
            await this.postMessageTransport.stopListeningForNewPeers();
            resolve(this.postMessageTransport.type);
          } catch (error) {
            fail(error);
          }
        });

        await this.postMessageTransport.client.sendPairingRequest(selectedExtension.id);
      } catch (error) {
        fail(error);
      }
    });

    return this._initPromise;
  };

  return client;
}

export function createTezosToolkit(rpcUrl) {
  return new TezosToolkit(rpcUrl);
}

export function createTezosWallet(options) {
  const client = patchClientForExtensions(getDAppClientInstance(options, true));
  const wallet = new BeaconWallet(options);

  wallet.client = client;

  return wallet;
}

export { MichelsonMap, stringToBytes };
