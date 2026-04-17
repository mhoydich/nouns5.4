import {
  getRoomSnapshot,
  joinRoom,
  recordPulse,
  recordReaction,
  sanitizeRoomId,
} from "../_lib/jam-store.js";

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
  return json(getRoomSnapshot(roomId));
}

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const roomId = sanitizeRoomId(body.roomId);
  const player = body.player ?? {};

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
