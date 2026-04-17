import { build } from "esbuild";
import { rm } from "node:fs/promises";
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
