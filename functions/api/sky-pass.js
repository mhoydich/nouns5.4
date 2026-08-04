import { buildSkyPassFeed } from "../_lib/sky-pass.js";

export async function onRequestGet(context) {
  try {
    const feed = await buildSkyPassFeed({ fetchImpl: fetch });
    return Response.json(feed, {
      headers: {
        "Cache-Control": "public, max-age=900, s-maxage=21600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "https://www.industrynext.xyz",
      },
    });
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
