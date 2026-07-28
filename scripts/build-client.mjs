import { build } from "esbuild";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const publicDir = resolve(rootDir, "public");

await rm(resolve(publicDir, "chunks"), { force: true, recursive: true });

await build({
  entryPoints: [
    resolve(rootDir, "src/app.js"),
    resolve(rootDir, "src/home.js"),
    resolve(rootDir, "src/tezos-client.js"),
  ],
  outdir: publicDir,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  splitting: true,
  entryNames: "[name]",
  chunkNames: "chunks/[name]-[hash]",
  inject: [resolve(rootDir, "src/browser-shims.js")],
  alias: {
    crypto: "crypto-browserify",
    process: "process/browser",
    stream: "stream-browserify",
    util: "util",
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  logLevel: "info",
});

const networkMarker = "data-pointcast-network";
const networkMountElement = "  <div data-pointcast-network data-publisher=\"industrynext\" data-placement=\"footer\" data-context=\"small internet institutions tone bloom pointcast rally nouns cc0 art culture community\" data-campaign=\"PC-NETWORK-EL-SEGUNDO-2026\"></div>";
const networkScriptElement = "  <script async src=\"https://pointcast.xyz/open-ad-network.js\"></script>";
const networkMountPattern = /^[ \t]*<div\s+[^>]*\bdata-pointcast-network\b[^>]*><\/div>[ \t]*\r?\n?/m;
const networkScriptPattern = /^[ \t]*<script\s+async\s+src="https:\/\/pointcast\.xyz\/open-ad-network\.js"><\/script>[ \t]*\r?\n?/m;
const bodyPattern = /<body\b[^>]*>/;
const bodyClose = "</body>";
const footerClose = "</footer>";

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

for (const htmlFile of await htmlFiles(publicDir)) {
  const html = await readFile(htmlFile, "utf8");
  if (html.includes(networkMarker) && !networkMountPattern.test(html)) {
    throw new Error(`Cannot update open ad network mount in ${htmlFile}`);
  }
  const body = html.match(bodyPattern)?.[0];
  if (!body) throw new Error(`Cannot find body for open ad network in ${htmlFile}`);
  const existingMountCount = (html.match(/data-pointcast-network/g) || []).length;
  const existingScriptCount = (html.match(/https:\/\/pointcast\.xyz\/open-ad-network\.js/g) || []).length;
  const existingMountIndex = html.indexOf(networkMarker);
  const existingScriptIndex = html.indexOf("https://pointcast.xyz/open-ad-network.js");
  const originalBodyCloseIndex = html.lastIndexOf(bodyClose);
  const originalFooterStartIndex = html.lastIndexOf("<footer");
  const originalFooterCloseIndex = html.lastIndexOf(footerClose);
  const mountIsCorrect = originalFooterCloseIndex === -1
    ? existingMountIndex > html.indexOf("<main") && existingMountIndex < originalBodyCloseIndex
    : existingMountIndex > originalFooterStartIndex && existingMountIndex < originalFooterCloseIndex;
  const scriptIsCorrect = existingScriptIndex > existingMountIndex && existingScriptIndex < originalBodyCloseIndex;

  if (existingMountCount === 1 && existingScriptCount === 1 && mountIsCorrect && scriptIsCorrect) {
    continue;
  }

  let nextHtml = html
    .replace(networkMountPattern, "")
    .replace(networkScriptPattern, "");

  const bodyCloseIndex = nextHtml.lastIndexOf(bodyClose);
  if (bodyCloseIndex === -1) throw new Error(`Cannot find closing body for open ad network in ${htmlFile}`);
  const footerCloseIndex = nextHtml.lastIndexOf(footerClose);
  const mountCloseIndex = footerCloseIndex === -1 ? bodyCloseIndex : footerCloseIndex;
  const mountIndex = nextHtml.lastIndexOf("\n", mountCloseIndex) + 1;
  nextHtml = `${nextHtml.slice(0, mountIndex)}${networkMountElement}\n${nextHtml.slice(mountIndex)}`;

  const bodyCloseAfterMount = nextHtml.lastIndexOf(bodyClose);
  const scriptIndex = nextHtml.lastIndexOf("\n", bodyCloseAfterMount) + 1;
  nextHtml = `${nextHtml.slice(0, scriptIndex)}${networkScriptElement}\n${nextHtml.slice(scriptIndex)}`;
  if (nextHtml !== html) await writeFile(htmlFile, nextHtml);
}
