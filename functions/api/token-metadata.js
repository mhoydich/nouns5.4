import { buildNounFromRequest, buildPublicUrls } from "../_lib/nouns-render.js";

function readString(searchParams, key, fallback) {
  const value = searchParams.get(key);
  return value && value.trim() ? value.trim() : fallback;
}

export async function onRequestGet(context) {
  try {
    const noun = await buildNounFromRequest(context.request);
    const url = new URL(context.request.url);
    const defaultName = `Industry Next Noun ${noun.seed.background}-${noun.seed.body}-${noun.seed.accessory}-${noun.seed.head}-${noun.seed.glasses}`;
    const defaultDescription = `A Nouns-inspired character published by Industry Next with a ${noun.labels.head} head, ${noun.labels.accessory} accessory, ${noun.labels.body} body, and ${noun.labels.glasses} glasses.`;
    const name = readString(url.searchParams, "name", defaultName);
    const description = readString(url.searchParams, "description", defaultDescription);
    const urls = buildPublicUrls(context.request, noun.seed, {
      name,
      description,
    });

    return Response.json(
      {
        name,
        description,
        symbol: "INDNOUN",
        decimals: 0,
        artifactUri: urls.imageUrl,
        displayUri: urls.imageUrl,
        thumbnailUri: urls.imageUrl,
        externalUri: urls.pageUrl,
        metadataUri: urls.metadataUrl,
        seed: noun.seed,
        background: noun.labels.background,
        attributes: [
          {
            name: "Body",
            value: noun.labels.body,
          },
          {
            name: "Accessory",
            value: noun.labels.accessory,
          },
          {
            name: "Head",
            value: noun.labels.head,
          },
          {
            name: "Glasses",
            value: noun.labels.glasses,
          },
        ],
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to build token metadata.",
      },
      {
        status: 500,
      },
    );
  }
}
