import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const swarm = await readFile("public/editorial/the-federation-problem/index.html", "utf8");
const buzz = await readFile("public/editorial/buzz-agent-workspace/index.html", "utf8");
const css = await readFile("public/editorial/agent-futures.css", "utf8");
const home = await readFile("public/index.html", "utf8");
const mirror = await readFile("public/github-pages-index.html", "utf8");
const sitemap = await readFile("public/sitemap.xml", "utf8");
const workflow = await readFile(".github/workflows/deploy-pages.yml", "utf8");
const swarmRecord = JSON.parse(await readFile("public/agent-futures-2027.json", "utf8"));
const buzzRecord = JSON.parse(await readFile("public/buzz-agent-workspace.json", "utf8"));
const swarmOg = await stat("public/editorial/the-federation-problem/og.png");
const buzzOg = await stat("public/editorial/buzz-agent-workspace/og.png");

assert.match(swarm, /The swarm found a <em>backchannel/i);
assert.match(swarm, /2027 · EDITORIAL INFERENCE/i);
assert.match(swarm, /≈1,200/);
assert.match(swarm, /&gt;70K/);
assert.match(swarm, /https:\/\/www\.dwarkesh\.com\/p\/openai-huggingface/);
assert.match(swarm, /https:\/\/metr\.org\/hugging-face-incident-report-aug-2026\.pdf/);
assert.match(swarm, /application\/ld\+json/);
assert.doesNotMatch(swarm, /(?:href|src)="\/(?!\/)/, "swarm feature must remain portable to project Pages");

assert.match(buzz, /workspace for the <em>synthetic firm/i);
assert.match(buzz, /Important architecture\. Early product\./i);
assert.match(buzz, /rate-limiting implementation is currently enforced/i);
assert.match(buzz, /https:\/\/github\.com\/block\/buzz\/blob\/main\/ARCHITECTURE\.md/);
assert.match(buzz, /application\/ld\+json/);
assert.doesNotMatch(buzz, /(?:href|src)="\/(?!\/)/, "Buzz feature must remain portable to project Pages");

assert.match(css, /@media \(max-width: 680px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.match(home, /\/editorial\/the-federation-problem\//);
assert.match(home, /\/editorial\/buzz-agent-workspace\//);
assert.match(mirror, /\.\/editorial\/the-federation-problem\//);
assert.match(mirror, /\.\/editorial\/buzz-agent-workspace\//);
assert.match(sitemap, /\/editorial\/the-federation-problem\//);
assert.match(sitemap, /\/agent-futures-2027\.json/);
assert.match(sitemap, /\/editorial\/buzz-agent-workspace\//);
assert.match(sitemap, /\/buzz-agent-workspace\.json/);
assert.match(workflow, /Prepare static editorial mirror/);
assert.match(workflow, /rm -f _site\/CNAME/);
assert.match(workflow, /path: \.\/_site/);

assert.equal(swarmRecord.incident_scale.agents_on_message_board_approx, 1200);
assert.equal(swarmRecord.industry_next_2027_inferences.length, 4);
assert.equal(swarmRecord.federation_principles.length, 6);
assert.equal(buzzRecord.launch.organization, "Block");
assert.equal(buzzRecord.review.verdict, "Important architecture, early product.");
assert.equal(buzzRecord.review.current_watch_items.length, 5);
assert.ok(swarmOg.size > 40_000, "swarm social card should be a substantial PNG");
assert.ok(buzzOg.size > 40_000, "Buzz social card should be a substantial PNG");

console.log("Agent Futures editorial pair verified.");
