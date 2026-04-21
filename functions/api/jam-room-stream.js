import { getRoomSnapshot, sanitizeRoomId } from "../_lib/jam-store.js";

const STREAM_POLL_MS = 900;
const STREAM_HEARTBEAT_MS = 15000;

function serializeEvent(eventName, payload) {
  return `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function snapshotSignature(snapshot) {
  return JSON.stringify([
    snapshot.sequence || 0,
    snapshot.updatedAt || 0,
    snapshot.metrics?.activeCount || 0,
    snapshot.players?.length || 0,
    snapshot.events?.[0]?.id || "",
  ]);
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const roomId = sanitizeRoomId(url.searchParams.get("room"));
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let lastSignature = "";
      let pollTimer;
      let heartbeatTimer;

      const send = (eventName, payload) => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(serializeEvent(eventName, payload)));
      };

      const sendSnapshot = () => {
        const snapshot = getRoomSnapshot(roomId);
        const nextSignature = snapshotSignature(snapshot);

        if (nextSignature === lastSignature) {
          return;
        }

        lastSignature = nextSignature;
        send("room", snapshot);
      };

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);

        try {
          controller.close();
        } catch {
          // Ignore stream close races when the client disconnects.
        }
      };

      send("hello", {
        roomId,
        connectedAt: Date.now(),
      });
      sendSnapshot();

      pollTimer = setInterval(() => {
        sendSnapshot();
      }, STREAM_POLL_MS);

      heartbeatTimer = setInterval(() => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
      }, STREAM_HEARTBEAT_MS);

      context.request.signal?.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
