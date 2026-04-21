import { buildNounFromRequest, buildPublicUrls } from "../_lib/nouns-render.js";

function readString(searchParams, key, fallback) {
  const value = searchParams.get(key);
  return value && value.trim() ? value.trim() : fallback;
}

function readNumber(searchParams, key, fallback) {
  const value = Number.parseInt(searchParams.get(key) ?? "", 10);
  return Number.isNaN(value) || value < 0 ? fallback : value;
}

export async function onRequestGet(context) {
  try {
    const noun = await buildNounFromRequest(context.request);
    const url = new URL(context.request.url);
    const kind = readString(url.searchParams, "kind", "drop").toLowerCase() === "noun"
      ? "noun"
      : "drop";
    const symbol = readString(url.searchParams, "symbol", kind === "noun" ? "NOUN" : "DRUM");
    const room = readString(url.searchParams, "room", "global-jam");
    const player = readString(url.searchParams, "player", "Rim Rider");
    const drop = readString(url.searchParams, "drop", "Garage Kick");
    const tier = readString(url.searchParams, "tier", "Starter");
    const score = readNumber(url.searchParams, "score", 0);
    const combo = readNumber(url.searchParams, "combo", 0);
    const defaultName = kind === "noun"
      ? `${player} / ${noun.labels.head} Noun`
      : `${drop} / ${player} / ${noun.labels.head}`;
    const defaultDescription = kind === "noun"
      ? `A Drum Nouns Jam noun collectible for ${player} in room ${room}, featuring a ${noun.labels.head} head, ${noun.labels.accessory} accessory, ${noun.labels.body} body, and ${noun.labels.glasses} glasses. Minted with ${drop} equipped after generating ${score} DRUM with a best combo of ${combo}.`
      : `A Drum Nouns Jam drop collectible for ${player} in room ${room}, featuring a ${noun.labels.head} head, ${noun.labels.accessory} accessory, ${noun.labels.body} body, and ${noun.labels.glasses} glasses after generating ${score} DRUM with a best combo of ${combo}.`;
    const name = readString(url.searchParams, "name", defaultName);
    const description = readString(url.searchParams, "description", defaultDescription);
    const urls = buildPublicUrls(context.request, noun.seed, {
      kind,
      symbol,
      name,
      description,
    });

    return Response.json(
      {
        name,
        description,
        symbol,
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
            name: "Collectible Type",
            value: kind === "noun" ? "Noun" : "Drop",
          },
          {
            name: "Drop",
            value: drop,
          },
          {
            name: "Tier",
            value: tier,
          },
          {
            name: "Room",
            value: room,
          },
          {
            name: "Player",
            value: player,
          },
          {
            name: "DRUM",
            value: score,
          },
          {
            name: "Best Combo",
            value: combo,
          },
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
