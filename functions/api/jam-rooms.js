import { getRoomDirectory } from "../_lib/jam-store.js";
import { coordinatorJson } from "../_lib/jam-room-service.js";

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const limit = Number.parseInt(url.searchParams.get("limit") || "6", 10);
  const coordinatorDirectory = await coordinatorJson(context, `/directory?limit=${encodeURIComponent(limit)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (coordinatorDirectory) {
    return json(coordinatorDirectory);
  }

  return json(getRoomDirectory(limit));
}
