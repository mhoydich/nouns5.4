import {
  exportRoomStoreSnapshot,
  getRoomDirectory,
  getRoomSnapshot,
  importRoomStoreSnapshot,
  joinRoom,
  recordPulse,
  recordReaction,
  sanitizeRoomId,
} from "../../functions/_lib/jam-store.js";

const STORAGE_KEY = "drum-nouns-jam-room-store.v1";

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export class JamRoomCoordinator {
  constructor(state) {
    this.state = state;
    this.loaded = false;
  }

  async load() {
    if (this.loaded) {
      return;
    }

    const snapshot = await this.state.storage.get(STORAGE_KEY);
    importRoomStoreSnapshot(snapshot || {});
    this.loaded = true;
  }

  async persist() {
    await this.state.storage.put(STORAGE_KEY, exportRoomStoreSnapshot());
  }

  async handleRoomGet(request) {
    const url = new URL(request.url);
    const roomId = sanitizeRoomId(url.searchParams.get("room"));

    return json(getRoomSnapshot(roomId));
  }

  async handleDirectoryGet(request) {
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get("limit") || "6", 10);

    return json(getRoomDirectory(limit));
  }

  async handleRoomPost(request) {
    const body = await readBody(request);
    const roomId = sanitizeRoomId(body.roomId);
    const player = body.player ?? {};
    let snapshot;

    switch (body.action) {
      case "join":
        snapshot = joinRoom(roomId, player);
        break;
      case "pulse":
        snapshot = recordPulse(roomId, player, {
          hits: body.hits,
          tokens: body.tokens,
          combo: body.combo,
        });
        break;
      case "reaction":
        snapshot = recordReaction(roomId, player, {
          reaction: body.reaction,
        });
        break;
      default:
        return json(
          {
            error: "Unsupported room action.",
          },
          400,
        );
    }

    await this.persist();
    return json(snapshot);
  }

  async fetch(request) {
    await this.load();

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname.endsWith("/directory")) {
      return this.handleDirectoryGet(request);
    }

    if (request.method === "GET") {
      return this.handleRoomGet(request);
    }

    if (request.method === "POST") {
      return this.handleRoomPost(request);
    }

    return json(
      {
        error: "Method not allowed.",
      },
      405,
    );
  }
}

export default {
  async fetch(request, env) {
    const id = env.JAM_ROOM_COORDINATOR.idFromName("global");
    const stub = env.JAM_ROOM_COORDINATOR.get(id);

    return stub.fetch(request);
  },
};
