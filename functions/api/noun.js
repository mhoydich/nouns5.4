import { buildNounFromRequest } from "../_lib/nouns-render.js";

export async function onRequestGet(context) {
  try {
    const noun = await buildNounFromRequest(context.request);

    return new Response(noun.svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to render noun.",
      },
      {
        status: 500,
      },
    );
  }
}
