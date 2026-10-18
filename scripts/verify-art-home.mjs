import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";
import { onRequestGet as onIndexRequest } from "../functions/index.js";
import { getRoomSnapshot } from "../functions/_lib/jam-store.js";
import { buildRoomMeta } from "../shared/drum-jam-telemetry.js";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const origin = "https://www.industrynext.xyz";
const home = await readFile(resolve(publicDir, "index.html"), "utf8");
const decode = (value) => value.replace(/&(?:amp|quot|apos|lt|gt|#39);/g, (entity) => ({
  "&amp;": "&", "&quot;": '"', "&apos;": "'", "&#39;": "'", "&lt;": "<", "&gt;": ">",
})[entity]);
const attributes = (source) => Object.fromEntries(
  [...source.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map(([, name, double, single]) => [name, decode(double ?? single)]),
);
const elements = (source) => [...source.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/gi)]
  .map(([, tag, source]) => ({ tag: tag.toLowerCase(), source, attrs: attributes(source) }));
const tags = elements(home);
const byTag = (name) => tags.filter(({ tag }) => tag === name);
const ids = tags.flatMap(({ attrs }) => attrs.id ? [attrs.id] : []);
const byId = (id, source = home) => {
  const matches = elements(source).filter(({ attrs }) => attrs.id === id);
  assert.equal(matches.length, 1, `one element with id=${id}`);
  return matches[0].attrs;
};

assert.equal(byTag("h1").length, 1, "one page heading");
assert.equal(byTag("main").length, 1, "one main landmark");
assert.equal(byTag("footer").length, 1, "one site footer");
assert.equal(byTag("html")[0].attrs.lang, "en");
assert.equal(new Set(ids).size, ids.length, "document ids are unique");
assert.equal(byTag("main")[0].attrs.id, "main");
assert.equal(byTag("main")[0].attrs.tabindex, "-1", "skip destination accepts focus");
assert.equal(byTag("a")[0].attrs.href, "#main", "skip link comes first");
assert.ok(byTag("a")[0].attrs.class.split(/\s+/).includes("skip-link"));
const navLabels = byTag("nav").map(({ attrs }) => attrs["aria-label"]);
assert.ok(navLabels.includes("Primary"));
assert.ok(navLabels.every(Boolean), "navigation landmarks have names");
assert.equal(new Set(navLabels).size, navLabels.length, "navigation names are distinct");
for (const { attrs } of tags) {
  for (const name of ["aria-labelledby", "aria-describedby", "aria-controls", "for"]) {
    for (const id of (attrs[name] || "").split(/\s+/).filter(Boolean)) {
      assert.ok(ids.includes(id), `${name} points to existing #${id}`);
    }
  }
}
for (const { attrs } of byTag("img")) {
  assert.ok(Object.hasOwn(attrs, "alt"), "images provide alternative text");
  assert.ok(Number(attrs.width) > 0 && Number(attrs.height) > 0, "images reserve layout space");
}

let localReferences = 0;
async function checkLocalReference(reference, base = `${origin}/`) {
  const url = new URL(reference, base);
  if (url.origin !== origin) return;
  const pathname = decodeURIComponent(url.pathname);
  const file = resolve(publicDir, `.${pathname}`, ...(pathname.endsWith("/") ? ["index.html"] : []));
  assert.ok(file.startsWith(publicDir.endsWith(sep) ? publicDir : publicDir + sep), `local path stays in public: ${reference}`);
  assert.ok((await stat(file)).isFile(), `local route or asset exists: ${reference}`);
  if (url.hash) {
    assert.ok(file.endsWith(".html"), `fragment targets HTML: ${reference}`);
    const target = await readFile(file, "utf8");
    const fragment = decodeURIComponent(url.hash.slice(1));
    assert.ok(elements(target).some(({ attrs }) => attrs.id === fragment), `fragment exists: ${reference}`);
  }
  localReferences += 1;
}
for (const { attrs } of tags) {
  for (const name of ["href", "src", "poster"]) if (attrs[name]) await checkLocalReference(attrs[name]);
  if (attrs.srcset) {
    for (const candidate of attrs.srcset.split(",")) await checkLocalReference(candidate.trim().split(/\s+/)[0]);
  }
}
const hrefs = new Set(byTag("a").map(({ attrs }) => attrs.href));
for (const href of [
  "/communications-lab/nouns-money/", "https://tonebloom.xyz/", "/agents/", "/sky-is-local/",
  "/editorial/tone-bloom-field-review/", "/editorial/the-wild-one-cent/", "/editorial/credit-card-games/",
  "/agents/#request", "/services/#start", "/help/", "/make/", "/communications-lab/",
]) assert.ok(hrefs.has(href), `featured work, reading, or established intake door: ${href}`);
for (const id of ["alive", "ways-in", "fields"]) assert.ok(ids.includes(id), `legacy homepage fragment #${id} survives`);
assert.doesNotMatch(home, /Good[\s-]*Feels|cannabis|The Segundo Line|segundo-line/i, "excluded and held projects are not promoted");

assert.equal(byId("meta-canonical").href, `${origin}/`);
assert.equal(byId("meta-canonical").rel, "canonical");
const title = decode(home.match(/<title>([^<]+)<\/title>/)[1]);
assert.ok(title.startsWith("Industry Next — "));
assert.ok(byId("meta-description").content.length > 50);
assert.equal(byId("meta-og-title").content, title);
assert.equal(byId("meta-twitter-title").content, title);
assert.equal(byId("meta-og-url").content, `${origin}/`);
for (const id of ["meta-og-description", "meta-og-image-alt", "meta-twitter-description"]) {
  assert.ok(byId(id).content.length > 20, `descriptive ${id}`);
}
const image = byId("meta-og-image").content;
assert.equal(byId("meta-twitter-image").content, image);
await checkLocalReference(image);
const imageBytes = await readFile(resolve(publicDir, `.${new URL(image).pathname}`));
assert.equal(imageBytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "share image is PNG");
for (const [property, offset] of [["og:image:width", 16], ["og:image:height", 20]]) {
  const meta = byTag("meta").find(({ attrs }) => attrs.property === property);
  assert.equal(Number(meta.attrs.content), imageBytes.readUInt32BE(offset), `${property} matches actual image`);
}
const structuredScripts = [...home.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(([, attrs]) => attributes(attrs).type === "application/ld+json");
assert.equal(structuredScripts.length, 1);
const structured = JSON.parse(structuredScripts[0][2]);
assert.equal(structured["@context"], "https://schema.org");
assert.equal(structured["@type"], "Organization");
assert.equal(structured.name, "Industry Next");
assert.equal(structured.url, `${origin}/`);
assert.equal(structured.founder.name, "Michael Hoydich");
const manifest = JSON.parse(await readFile(resolve(publicDir, "site.webmanifest"), "utf8"));
assert.equal(manifest.icons[0].src, "/industry-next-icon.svg");

// The directory and primary calls to action work without a homepage runtime.
const details = home.match(/<details\b[^>]*>([\s\S]*?)<\/details>/g) || [];
assert.equal(details.length, 1);
assert.match(details[0], /^<details\b[^>]*>\s*<summary\b[^>]*>[\s\S]+<\/summary>/);
assert.match(details[0], /<nav\b/);
assert.equal(byTag("form").length, 0, "intake remains on established routes");
for (const { attrs } of tags) assert.ok(!Object.keys(attrs).some((name) => /^on[a-z]+$/i.test(name)), "no inline event handlers");
const runtimeScripts = byTag("script").filter(({ attrs }) => attrs.type !== "application/ld+json");
assert.equal(runtimeScripts.length, 1, "only the existing optional footer network runtime is present");
assert.equal(runtimeScripts[0].attrs.src, "https://pointcast.xyz/open-ad-network.js");
assert.match(runtimeScripts[0].source, /\basync\b/);
const footer = home.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)[1];
assert.equal((home.match(/data-pointcast-network/g) || []).length, 1);
assert.match(footer, /data-pointcast-network[^>]*data-placement="footer"/);
assert.doesNotMatch(footer.match(/<div\b[^>]*data-pointcast-network[^>]*>/)[0], /\bdata-campaign=/);
const stylesheet = byTag("link").find(({ attrs }) => attrs.rel === "stylesheet").attrs.href;
const stylesheetUrl = new URL(stylesheet, origin);
const css = await readFile(resolve(publicDir, `.${stylesheetUrl.pathname}`), "utf8");
for (const [, quoted, plain] of css.matchAll(/url\(\s*(?:["']([^"']+)["']|([^\s)]+))\s*\)/g)) {
  await checkLocalReference(quoted ?? plain, stylesheetUrl);
}
assert.match(css, /:focus-visible/);
assert.match(css, /\.skip-link:focus/);
assert.match(css, /prefers-reduced-motion\s*:\s*reduce/);
assert.match(css, /@media\s*\(max-width\s*:/);

// Existing jam shares may rewrite head metadata, never the homepage body.
for (const path of ["/", "/?utm_source=homepage-check"]) {
  const response = await onIndexRequest({
    request: new Request(origin + path),
    next: async () => new Response(home, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
  });
  assert.equal(await response.text(), home, `ordinary homepage metadata stays intact: ${path}`);
}
const roomId = "homepage-regression";
const meta = buildRoomMeta(getRoomSnapshot(roomId), roomId);
const roomResponse = await onIndexRequest({
  request: new Request(`${origin}/?room=${roomId}`),
  next: async () => new Response(home, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
});
const roomHtml = await roomResponse.text();
assert.equal(roomResponse.status, 200);
assert.match(roomResponse.headers.get("Content-Type"), /text\/html/);
assert.equal(decode(roomHtml.match(/<title>([^<]+)<\/title>/)[1]), meta.pageTitle);
for (const [id, value] of Object.entries({
  "meta-description": meta.description,
  "meta-og-title": meta.socialTitle,
  "meta-og-description": meta.socialDescription,
  "meta-og-url": meta.shareUrl,
  "meta-og-image": meta.ogImageUrl,
  "meta-og-image-alt": meta.ogImageAlt,
  "meta-twitter-title": meta.socialTitle,
  "meta-twitter-description": meta.socialDescription,
  "meta-twitter-image": meta.ogImageUrl,
})) assert.equal(byId(id, roomHtml).content, value, `jam share rewrites ${id}`);
assert.equal(byId("meta-canonical", roomHtml).href, meta.shareUrl);
assert.equal(roomHtml.slice(roomHtml.indexOf("<body")), home.slice(home.indexOf("<body")), "jam share preserves page content");

console.log(`Homepage verified: semantic landmarks, ${localReferences} local routes/assets/fragments, work and intake doors, native navigation, social metadata, and ordinary/jam sharing.`);
