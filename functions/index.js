import { getRoomSnapshot, sanitizeRoomId } from "./_lib/jam-store.js";
import { buildRoomMeta, escapeHtml } from "../shared/drum-jam-telemetry.js";

function replaceTitle(html, value) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(value)}</title>`);
}

function replaceAttributeById(html, id, attribute, value) {
  const escapedValue = escapeHtml(value);
  const pattern = new RegExp(`(<[^>]+id="${id}"[^>]*\\s${attribute}=")([^"]*)(")`, "i");
  return html.replace(pattern, `$1${escapedValue}$3`);
}

export function rewriteRoomMeta(html, meta) {
  let nextHtml = replaceTitle(html, meta.pageTitle);

  nextHtml = replaceAttributeById(nextHtml, "meta-description", "content", meta.description);
  nextHtml = replaceAttributeById(nextHtml, "meta-og-title", "content", meta.socialTitle);
  nextHtml = replaceAttributeById(nextHtml, "meta-og-description", "content", meta.socialDescription);
  nextHtml = replaceAttributeById(nextHtml, "meta-og-url", "content", meta.shareUrl);
  nextHtml = replaceAttributeById(nextHtml, "meta-og-image", "content", meta.ogImageUrl);
  nextHtml = replaceAttributeById(nextHtml, "meta-og-image-alt", "content", meta.ogImageAlt);
  nextHtml = replaceAttributeById(nextHtml, "meta-twitter-title", "content", meta.socialTitle);
  nextHtml = replaceAttributeById(nextHtml, "meta-twitter-description", "content", meta.socialDescription);
  nextHtml = replaceAttributeById(nextHtml, "meta-twitter-image", "content", meta.ogImageUrl);
  nextHtml = replaceAttributeById(nextHtml, "meta-canonical", "href", meta.shareUrl);

  return nextHtml;
}

export async function onRequestGet(context) {
  const response = await context.next();
  const contentType = response.headers.get("Content-Type") || "";

  if (!contentType.includes("text/html")) {
    return response;
  }

  const url = new URL(context.request.url);
  const roomId = sanitizeRoomId(url.searchParams.get("room"));
  const snapshot = getRoomSnapshot(roomId);
  const meta = buildRoomMeta(snapshot, roomId);
  const html = await response.text();
  const rewrittenHtml = rewriteRoomMeta(html, meta);
  const headers = new Headers(response.headers);

  headers.set("Content-Type", "text/html; charset=utf-8");

  return new Response(rewrittenHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
