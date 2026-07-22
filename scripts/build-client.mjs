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
const networkMountElement = "  <div data-pointcast-network data-publisher=\"industrynext\" data-placement=\"first-100-lead\" data-context=\"tezos network el segundo first 100 wallet nouns cc0 art culture community\" data-campaign=\"PC-NETWORK-EL-SEGUNDO-2026\"></div>";
const networkMount = [
  networkMountElement,
  "  <script async src=\"https://pointcast.xyz/open-ad-network.js\"></script>",
].join("\n");
const networkMountPattern = /[ \t]*<div\s+[^>]*\bdata-pointcast-network\b[^>]*><\/div>/;

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
  let nextHtml;
  if (html.includes(networkMarker)) {
    if (!networkMountPattern.test(html)) {
      throw new Error(`Cannot update open ad network mount in ${htmlFile}`);
    }
    nextHtml = html.replace(networkMountPattern, networkMountElement);
  } else {
    if (!html.includes("</body>")) throw new Error(`Cannot mount open ad network in ${htmlFile}`);
    nextHtml = html.replace("</body>", `${networkMount}\n</body>`);
  }
  if (nextHtml !== html) await writeFile(htmlFile, nextHtml);
}
