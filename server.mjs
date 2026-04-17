import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

function notFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

async function serveStatic(requestPath, response) {
  const normalized = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(publicDir, normalized);

  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath);
    const contentType =
      extension === ".html"
        ? "text/html; charset=utf-8"
        : extension === ".css"
          ? "text/css; charset=utf-8"
          : extension === ".js"
            ? "text/javascript; charset=utf-8"
            : "application/octet-stream";

    response.writeHead(200, { "Content-Type": contentType });
    response.end(file);
  } catch {
    notFound(response);
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  await serveStatic(url.pathname, response);
}).listen(port, host, () => {
  console.log(`Nouns prototype running at http://${host}:${port}`);
});
