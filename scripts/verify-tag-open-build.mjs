import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const html = await readFile(resolve(root, "public/next/tag/index.html"), "utf8");
const css = await readFile(resolve(root, "public/next/tag/tag.css"), "utf8");
const js = await readFile(resolve(root, "public/next/tag/tag.js"), "utf8");
const next = await readFile(resolve(root, "public/next/index.html"), "utf8");
const sitemap = await readFile(resolve(root, "public/sitemap.xml"), "utf8");
const brief = JSON.parse(await readFile(resolve(root, "public/tag-open-build.json"), "utf8"));
const checks = [
  [html.includes("https://www.industrynext.xyz/next/tag/"), "canonical route"], [html.includes("Open Build 001"), "identity"],
  [html.includes("AI-credit budget provided"), "funding"], [html.includes("Credits cover AI model and tool usage"), "credit boundary"],
  [html.includes('id="tag-application"'), "application form"], [html.includes('name="shipped"') && html.includes('name="prototype"') && html.includes('name="availability"'), "prompts"],
  [html.includes("nothing is uploaded by this page"), "privacy"], [html.includes("/tag-open-build.json"), "machine brief"],
  [html.includes("/next/tag/tag-open-build.pptx"), "deck"], [js.includes("mailto:mh@pointcast.xyz"), "email handoff"],
  [js.includes("localStorage"), "local draft"], [css.includes("@media (max-width: 620px)"), "mobile layout"],
  [next.includes('href="/next/tag/"'), "field-map link"], [sitemap.includes("https://www.industrynext.xyz/next/tag/"), "sitemap"],
  [brief.id === "industrynext.open-build.tag-001" && brief.status === "open", "brief identity"], [brief.support?.terms?.includes("Cash costs"), "brief terms"]
];
for (const [ok, label] of checks) if (!ok) throw new Error(`TAG open build verification failed: ${label}`);
await access(resolve(root, "public/next/tag/tag-hero.png"));
await access(resolve(root, "public/next/tag/tag-open-build.pptx"));
console.log(`TAG open build verified (${checks.length} content checks + 2 assets).`);
