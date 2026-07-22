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
const networkMount = [
  "  <div data-pointcast-network data-publisher=\"industrynext\" data-placement=\"site-footer\"></div>",
  "  <script async src=\"https://pointcast.xyz/open-ad-network.js\"></script>",
].join("\n");

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
  if (html.includes(networkMarker)) continue;
  if (!html.includes("</body>")) throw new Error(`Cannot mount open ad network in ${htmlFile}`);
  await writeFile(htmlFile, html.replace("</body>", `${networkMount}\n</body>`));
}
