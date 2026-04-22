import {
  getRoomSnapshot,
  joinRoom,
  recordPulse,
  recordReaction,
  sanitizeRoomId,
} from "../_lib/jam-store.js";
import { fetchRoomCoordinator } from "../_lib/jam-room-service.js";

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

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const roomId = sanitizeRoomId(url.searchParams.get("room"));
  const coordinatorResponse = await fetchRoomCoordinator(context, `/room?room=${encodeURIComponent(roomId)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (coordinatorResponse) {
    return coordinatorResponse;
  }

  return json(getRoomSnapshot(roomId));
}

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const roomId = sanitizeRoomId(body.roomId);
  const player = body.player ?? {};
  const coordinatorResponse = await fetchRoomCoordinator(context, "/room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...body,
      roomId,
      player,
    }),
  });

  if (coordinatorResponse) {
    return coordinatorResponse;
  }

  switch (body.action) {
    case "join":
      return json(joinRoom(roomId, player));
    case "pulse":
      return json(
        recordPulse(roomId, player, {
          hits: body.hits,
          tokens: body.tokens,
          combo: body.combo,
        }),
      );
    case "reaction":
      return json(
        recordReaction(roomId, player, {
          reaction: body.reaction,
        }),
      );
    default:
      return json(
        {
          error: "Unsupported room action.",
        },
        400,
      );
  }
}
