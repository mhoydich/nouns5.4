import { buildSkyPassFeed } from "../_lib/sky-pass.js";

function cacheRequestFor(request) {
  const url = new URL(request.url);
  url.search = "";
  return new Request(url.toString(), { method: "GET" });
}

export async function onRequestGet(context) {
  try {
    const edgeCache = typeof caches === "undefined" ? null : caches.default;
    const cacheRequest = cacheRequestFor(context.request);
    const cached = edgeCache ? await edgeCache.match(cacheRequest) : null;
    if (cached) return cached;

    const feed = await buildSkyPassFeed({ fetchImpl: fetch });
    const response = Response.json(feed, {
      headers: {
        "Cache-Control": "public, max-age=900, s-maxage=21600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "https://www.industrynext.xyz",
      },
    });
    if (edgeCache) context.waitUntil(edgeCache.put(cacheRequest, response.clone()));
    return response;
  } catch (error) {
    return Response.json(
      {
        schemaVersion: "industrynext.sky-pass.v1",
        status: "unavailable",
        error: error instanceof Error ? error.message : "The sky feed is resting.",
        note: "The on-page sound rehearsal remains available without orbital data.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "public, max-age=60",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
