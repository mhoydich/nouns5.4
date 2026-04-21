import { getMintFeedSnapshot, recordMint } from "../_lib/mint-feed-store.js";

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

export async function onRequestGet() {
  return json(getMintFeedSnapshot());
}

export async function onRequestPost(context) {
  const body = await readBody(context.request);

  try {
    return json(
      recordMint({
        roomId: body.roomId,
        playerName: body.playerName,
        target: body.target,
        dropTitle: body.dropTitle,
        nounHead: body.nounHead,
        opHash: body.opHash,
        explorerUrl: body.explorerUrl,
      }),
    );
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Unable to record this mint right now.",
      },
      400,
    );
  }
}
