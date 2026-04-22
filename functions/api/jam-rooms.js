import { getRoomDirectory } from "../_lib/jam-store.js";
import { fetchRoomCoordinator } from "../_lib/jam-room-service.js";

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
  const coordinatorResponse = await fetchRoomCoordinator(context, `/directory?limit=${encodeURIComponent(limit)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (coordinatorResponse) {
    return coordinatorResponse;
  }

  return json(getRoomDirectory(limit));
}
