import { getRoomDirectory } from "../_lib/jam-store.js";

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

  return json(getRoomDirectory(limit));
}
