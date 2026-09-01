import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const paths = {
  html: "public/ai-tools-mcp/index.html",
  css: "public/ai-tools-mcp/atlas.css",
  script: "public/ai-tools-mcp/atlas.js",
  og: "public/ai-tools-mcp/og.svg",
  json: "public/ai-tools-mcp.json",
};

await Promise.all(Object.values(paths).map((path) => access(new URL(path, root))));

const [html, css, script, og, dataText, home, earlyCareerHtml, earlyCareerText, sitemap, headers, manifestText, packageText] = await Promise.all([
  read(paths.html),
  read(paths.css),
  read(paths.script),
  read(paths.og),
  read(paths.json),
  read("public/index.html"),
  read("public/early-career/index.html"),
  read("public/early-career.json"),
  read("public/sitemap.xml"),
  read("public/_headers"),
  read("public/site.webmanifest"),
  read("package.json"),
]);

const data = JSON.parse(dataText);
const earlyCareer = JSON.parse(earlyCareerText);
const manifest = JSON.parse(manifestText);
const pkg = JSON.parse(packageText);

assert.match(html, /TOOLCHAIN ATLAS \/ BENCH 004 \/ LAST CHECKED 2026-08-31/);
assert.match(html, /Choose the work[\s\S]*Wire the tools/);
assert.match(html, /10[\s\S]*AI work surfaces/);
assert.match(html, /7[\s\S]*Useful MCP servers/);
assert.match(html, /0[\s\S]*Affiliate links/);
assert.match(html, /The model is not[\s\S]*the connection/);
assert.match(html, /id="stack-builder"/);
assert.match(html, /id="posture-select"/);
assert.match(html, /id="ai-search"/);
assert.match(html, /id="permission-gate"/);
assert.match(html, /Start with[\s\S]*documentation/);
assert.match(html, /Industry Next receives no affiliate compensation/);
assert.match(html, /href="\/ai-tools-mcp\.json"/);
assert.match(html, /data-pointcast-network[^>]+data-placement="footer"/);

assert.equal((html.match(/data-ai-card/g) || []).length, 10);
assert.equal((html.match(/data-mcp-card/g) || []).length, 7);
assert.equal((html.match(/data-outcome="(?:site|brief|design|bug|review|api)"/g) || []).length, 6);
for (const name of ["ChatGPT", "Claude", "Gemini", "NotebookLM", "Perplexity", "Codex", "Claude Code", "Cursor", "Figma Make", "Runway"]) {
  assert.match(html, new RegExp(`<h3>${name.replaceAll("+", "\\+")}</h3>`));
}
for (const name of ["OpenAI Docs", "Context7", "Figma", "Playwright", "Chrome DevTools", "Sentry", "GitHub"]) {
  assert.match(html, new RegExp(`<h3>${name}</h3>`));
}
assert.match(html, /codex mcp add openaiDeveloperDocs --url https:\/\/developers\.openai\.com\/mcp/);
assert.match(html, /codex mcp add context7 -- npx -y @upstash\/context7-mcp/);
assert.match(html, /href="https:\/\/registry\.modelcontextprotocol\.io\/"/);

assert.match(css, /\.patch-panel/);
assert.match(css, /\.stack-builder/);
assert.match(css, /\.tool-grid/);
assert.match(css, /\.mcp-grid/);
assert.match(css, /@media \(max-width: 480px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /@media print/);

assert.match(script, /const stacks =/);
assert.match(script, /const postures =/);
assert.match(script, /renderStack/);
assert.match(script, /filterAiCards/);
assert.match(script, /navigator\.clipboard\.writeText/);
assert.match(script, /URLSearchParams/);
assert.match(script, /history\.replaceState/);
assert.match(script, /replaceChildren/);
assert.match(script, /textContent/);
assert.doesNotMatch(script, /innerHTML|fetch\s*\(|localStorage|sessionStorage|document\.cookie/);

assert.match(og, /width="1200" height="630"/);
assert.match(og, /AI \+ MCP/);
assert.match(og, /PERMISSION GATE/);

assert.equal(data.schema, "industrynext.ai-tools-mcp-atlas/v1");
assert.equal(data.canonical, "https://www.industrynext.xyz/ai-tools-mcp/");
assert.equal(data.published, "2026-08-31");
assert.equal(data.last_reviewed, "2026-08-31");
assert.equal(data.editorial_policy.affiliate_compensation, false);
assert.equal(data.editorial_policy.transmits_or_stores_builder_selections, false);
assert.equal(data.ai_tools.length, 10);
assert.equal(data.mcp_servers.length, 7);
assert.equal(data.stack_builder.outcomes.length, 6);
assert.equal(data.stack_builder.postures.length, 3);
assert.equal(data.permission_gate.length, 6);
assert.equal(new Set(data.ai_tools.map((item) => item.id)).size, 10);
assert.equal(new Set(data.mcp_servers.map((item) => item.id)).size, 7);
assert.ok(data.ai_tools.every((item) => item.official_url.startsWith("https://")));
assert.ok(data.mcp_servers.every((item) => item.official_url.startsWith("https://")));
assert.ok(data.mcp_servers.every((item) => item.first_test && item.boundary));
assert.ok(data.stack_builder.outcomes.every((stack) => stack.ai_tools.length === 2 && stack.mcp_servers.length === 3));
for (const item of [...data.ai_tools, ...data.mcp_servers]) {
  assert.ok(html.includes(`href="${item.official_url}"`), `${item.name} official URL must be crawlable in HTML`);
}

assert.match(home, /href="\/ai-tools-mcp\/"/);
assert.match(earlyCareerHtml, /href="\/ai-tools-mcp\/"/);
assert.ok(earlyCareer.resources.some((resource) => resource.id === "ai-tools-mcp-atlas-017"));
assert.match(sitemap, /industrynext\.xyz\/ai-tools-mcp\//);
assert.match(sitemap, /industrynext\.xyz\/ai-tools-mcp\.json/);
assert.match(headers, /\/ai-tools-mcp\.json[\s\S]*Content-Type: application\/json/);
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/ai-tools-mcp/"));
assert.equal(pkg.scripts["verify:ai-tools-mcp"], "node ./scripts/verify-ai-tools-mcp.mjs");

console.log("AI + MCP Toolchain Atlas verification passed: 10 AI work surfaces, seven useful MCP servers, six local stack outcomes, three permission postures, official publisher doors, machine-readable twin, and public entry points.");
