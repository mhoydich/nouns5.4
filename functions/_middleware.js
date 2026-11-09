// Adds the open counts line ("This page: N views this week · N here now") to every HTML page.
// Educational lab pages stay as they are: they load no activity scripts.
const SKIP = ["/api/", "/communications-lab/", "/ai-thesis-atlas/"];
export const COUNTS_LINE = '<p class="open-counts" style="margin:1.5rem auto;max-width:60rem;padding:0 1rem;font:13px/1.4 system-ui,sans-serif;opacity:.75"><span data-page-views hidden></span> <span data-here-now hidden></span> <a href="/api/views" rel="nofollow">Open counts</a></p>';
export const COUNTS_SCRIPT = '<script defer src="/open-counts.js"></script>';

export function wantsCounts(pathname, contentType) {
  if (!/text\/html/i.test(contentType || "")) return false;
  return !SKIP.some((prefix) => pathname.startsWith(prefix));
}

export async function onRequest(context) {
  const response = await context.next();
  const { pathname } = new URL(context.request.url);
  if (context.request.method !== "GET" || !wantsCounts(pathname, response.headers.get("content-type"))) return response;
  if (typeof HTMLRewriter === "undefined") return response;
  return new HTMLRewriter()
    .on("body", { element(el) { el.append(COUNTS_LINE + COUNTS_SCRIPT, { html: true }); } })
    .transform(response);
}
