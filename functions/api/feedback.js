import { getFeedbackSnapshot, submitFeedback } from "../_lib/feedback-store.js";

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
  return json(getFeedbackSnapshot());
}

export async function onRequestPost(context) {
  const body = await readBody(context.request);

  try {
    return json(
      submitFeedback({
        name: body.name,
        area: body.area,
        note: body.note,
        roomId: body.roomId,
      }),
    );
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Unable to save feedback right now.",
      },
      400,
    );
  }
}
