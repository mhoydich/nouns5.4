// Industry Next 8-bit art kit.
// Original pixel sprites, drawn here as text grids, rendered to crisp SVG and to the
// homepage share PNG. Nothing is traced from an existing game. The noggles are the
// CC0 Nouns trait. Run: node scripts/build-8bit-art.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artDir = resolve(root, "public/art/8bit");

export const PALETTE = {
  K: "#1d2b53", // ink
  W: "#f4f0e4", // paper
  w: "#ffffff",
  Y: "#ffd23f", // gold
  O: "#ff9f43",
  R: "#ff5a4e", // noggles red
  G: "#3fd47a",
  g: "#1f8a52",
  C: "#59f4e8",
  B: "#2a6fdb",
  b: "#1b4aa0",
  S: "#e9c28b", // sand
  s: "#a8643c", // wood / mule brown
  t: "#7a4428", // dark brown
  D: "#c2c3c7",
  d: "#7c7f8c",
  P: "#7e57c2",
};

// Pack mule wearing noggles, facing right, crates on its back. 26 x 20.
const MULE = `
...................K..K...
..................KsK.Ks..
..................KsKKsK..
..KKKKKKKKKK.......KssssK.
..KYYsYYYsYK......KsRRRRRK
..KYYsYYYsYK.....KssRwKRsK
..KssssssssK....KsssRRRRsK
..KYYsYYYsYK...KsssssssssK
.KKKKKKKKKKKK.KssssssstssK
KssssssssssssKsssssK.KtttK
KsssssssssssssssssK...KKK.
KsssssssssssssssssK.......
KsssssssssssssssssK.......
.KsssssssssssssssK........
.KssKKsssssssKKssK........
.KssK.KssK.KssK.KssK......
.KssK.KssK.KssK.KssK......
.KttK.KttK.KttK.KttK......
.KKKK.KKKK.KKKK.KKKK......
..........................
`;

// Builder in a hard hat and noggles, front view. 14 x 20.
const BUILDER = `
....KKKKKK....
...KYYYYYYK...
..KYYYYYYYYK..
.KKKKKKKKKKKK.
...KSSSSSSK...
.RRRRR.RRRRR..
.RwwKRRRwwKR..
.RRRRR.RRRRR..
...KSSSSSSK...
...KSSttSSK...
....KSSSSK....
..KKBBBBBBKK..
.KBBBYBBYBBBK.
KSKBBBBBBBBKSK
KSKBBBBBBBBKSK
.K.KBBBBBBK.K.
...KbbKKbbK...
...KbbK.KbbK..
...KttK.KttK..
...KKKK.KKKK..
`;

// The Exchange: a small market hall with a flag. 32 x 26.
const EXCHANGE = `
...............KR...............
...............KRRR.............
...............KRRRRR...........
...............K................
...............K................
..........KKKKKKKKKKKK..........
........KKYYYYYYYYYYYYKK........
......KKYYYYYYYYYYYYYYYYKK......
....KKYYYYYYYYYYYYYYYYYYYYKK....
..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..
..KWWWWWWWWWWWWWWWWWWWWWWWWWWK..
..KWKKKKKKKKKKKKKKKKKKKKKKKKWK..
..KWKRRRRRRRRRRRRRRRRRRRRRRKWK..
..KWKKKKKKKKKKKKKKKKKKKKKKKKWK..
..KWWWWWWWWWWWWWWWWWWWWWWWWWWK..
..KWWKKKKWWWWWKKKKKKWWWWWKKKKK..
..KWWKCCKWWWWWKsssskWWWWWKCCKK..
..KWWKCCKWWWWWKssssKWWWWWKCCKK..
..KWWKKKKWWWWWKssssKWWWWWKKKKK..
..KWWWWWWWWWWWKssYsKWWWWWWWWWK..
..KWWWWWWWWWWWKssssKWWWWWWWWWK..
..KWWWWWWWWWWWKssssKWWWWWWWWWK..
KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
KDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDK
KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
................................
`.replace(/k/g, "K");

// Offer icons, 16 x 16 each: one crate, a loaded cart, a silo, a tower with a flag.
const CRATE = `
................
................
................
................
...KKKKKKKKKK...
...KYYYsYYYYK...
...KYYYsYYYYK...
...KssssssssK...
...KYYYsYYYYK...
...KYYYsYYYYK...
...KssssssssK...
...KYYYsYYYYK...
...KYYYsYYYYK...
...KKKKKKKKKK...
................
................
`;
const CART = `
................
................
................
................
...KKKKK........
...KYsYK.KKKKK..
...KsssK.KOOOK..
...KYsYK.KOsOK..
.KKKKKKKKKKKKKK.
.KssssssssssssK.
.KsKsssssssKssK.
.KKKKKKKKKKKKKK.
..KdKK....KdKK..
..KDDK....KDDK..
...KK......KK...
................
`;
const SILO = `
................
.....KKKKKK.....
....KRRRRRRK....
...KRRRRRRRRK...
...KKKKKKKKKK...
...KWWWWWWWWK...
...KWKKWWKKWK...
...KWWWWWWWWK...
...KDDDDDDDDK...
...KWWWWWWWWK...
...KWKKWWKKWK...
...KWWWWWWWWK...
...KDDDDDDDDK...
...KWWWKKWWWK...
...KWWWKKWWWK...
..KKKKKKKKKKKK..
`;
const TOWER = `
......KRRR......
......KRRRRR....
......K.........
.....KKKK.......
....KCCCCK......
...KKKKKKKK.....
...KWWWWWWK.....
...KWKKWKKK.KKK.
...KWWWWWWKKCCK.
...KWKKWKKKKWWK.
...KWWWWWWKKWWK.
...KWKKWKKKKWWK.
...KWWWWWWKKWWK.
...KWWKKWWKKWWK.
..KKKKKKKKKKKKKK
................
`;

// Small sun and cloud for the sky.
const SUN = `
...Y..Y...
.Y.YYYY.Y.
..YYYYYY..
YYYYOOYYYY
.YYYOOYYY.
.YYYYYYYY.
YYYYYYYYYY
..YYYYYY..
.Y.YYYY.Y.
...Y..Y...
`;
const CLOUD = `
.....wwww.......
...wwwwwwww.....
.wwwwwwwwwwwww..
wwwwwwwwwwwwwwww
.DDDDDDDDDDDDDD.
`;

// 16 x 16 land plots.
const TILE = {
  water: `
BBBBBBBBBBBBBBBB
BBBBBBBBBBBBBBBB
BBBCCBBBBBBBBBBB
BBCBBCBBBBBBBBBB
BBBBBBBBBBBCCBBB
BBBBBBBBBBCBBCBB
BBBBBBBBBBBBBBBB
BBBBBBBBBBBBBBBB
BBBBBCCBBBBBBBBB
BBBBCBBCBBBBBBBB
BBBBBBBBBBBBBBBB
BBBBBBBBBBBBCCBB
BBBBBBBBBBBCBBCB
BBBBBBBBBBBBBBBB
BBCCBBBBBBBBBBBB
BCBBCBBBBBBBBBBB
`,
  sand: `
SSSSSSSSSSSSSSSS
SSSSSsSSSSSSSSSS
SSSSSSSSSSSSSSsS
SSsSSSSSSSSSSSSS
SSSSSSSSSsSSSSSS
SSSSSSSSSSSSSSSS
SSSSSSsSSSSSSSSS
SSSSSSSSSSSSSsSS
SsSSSSSSSSSSSSSS
SSSSSSSSSSsSSSSS
SSSSSSSSSSSSSSSS
SSSSsSSSSSSSSSSS
SSSSSSSSSSSSSSSs
SSSSSSSSsSSSSSSS
SSsSSSSSSSSSSSSS
SSSSSSSSSSSSSSSS
`,
  field: `
GGGGGGGGGGGGGGGG
GGgGGGGGGgGGGGGG
GGGGGGGGGGGGGgGG
GGGGGgGGGGGGGGGG
GgGGGGGGGGGgGGGG
GGGGGGGGGGGGGGGG
GGGGGGGgGGGGGGgG
GGGgGGGGGGGGGGGG
GGGGGGGGGGgGGGGG
GGGGGGGGGGGGGGGG
GgGGGGGGGGGGGgGG
GGGGGGgGGGGGGGGG
GGGGGGGGGGGGGGGG
GGGGGGGGGgGGGGGG
GGgGGGGGGGGGGGgG
GGGGGGGGGGGGGGGG
`,
  crops: `
GGGGGGGGGGGGGGGG
GYGGYGGYGGYGGYGG
GgGGgGGgGGgGGgGG
GGGGGGGGGGGGGGGG
GGYGGYGGYGGYGGYG
GGgGGgGGgGGgGGgG
GGGGGGGGGGGGGGGG
GYGGYGGYGGYGGYGG
GgGGgGGgGGgGGgGG
GGGGGGGGGGGGGGGG
GGYGGYGGYGGYGGYG
GGgGGgGGgGGgGGgG
GGGGGGGGGGGGGGGG
GYGGYGGYGGYGGYGG
GgGGgGGgGGgGGgGG
GGGGGGGGGGGGGGGG
`,
  rows: `
GGGGGGGGGGGGGGGG
ssssssssssssssss
GGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGG
ssssssssssssssss
GGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGG
ssssssssssssssss
GGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGG
ssssssssssssssss
GGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGG
ssssssssssssssss
GGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGG
`,
  hills: `
GGGGGGGGGGGGGGGG
GGGGGGGKKGGGGGGG
GGGGGGKddKGGGGGG
GGGGGKddddKGGGGG
GGGGKdwddddKGGGG
GGGKddddddddKGGG
GGKddddddddddKGG
GKddddddKKddddKG
KdddddddKdKddddK
ddddddddddddddd
GGGGGGGGGGGGGGGG
GGGgGGGGGGGGGgGG
GGGGGGGGGGGGGGGG
GGGGGGgGGGGGGGGG
GGGGGGGGGGGGGGGG
GgGGGGGGGGGGGGGG
`.replace("\nddddddddddddddd\n", "\nKKKKKKKKKKKKKKKK\n"),
  path: `
SSSSSSSSSSSSSSSS
SSSSSSSSSSSSSSSS
SSSsSSSSSSSSSSSS
SSSSSSSSSSSsSSSS
SSSSSSSSSSSSSSSS
SSSSSSsSSSSSSSSS
SSSSSSSSSSSSSSSS
SsSSSSSSSSSSSSSS
SSSSSSSSSSSSSsSS
SSSSSSSSSSSSSSSS
SSSSSsSSSSSSSSSS
SSSSSSSSSSSSSSSS
SSSSSSSSSsSSSSSS
SSsSSSSSSSSSSSSS
SSSSSSSSSSSSSSSS
SSSSSSSSSSSSSSSS
`,
};

function grid(text) {
  const rows = text.split("\n").filter((row) => row.length);
  const width = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => row.padEnd(width, "."));
}

// A canvas of palette keys that sprites are stamped onto.
function canvas(width, height, fill = ".") {
  return Array.from({ length: height }, () => Array(width).fill(fill));
}
function stamp(target, sprite, x0, y0) {
  const rows = grid(sprite);
  rows.forEach((row, y) => {
    [...row].forEach((key, x) => {
      const tx = x0 + x;
      const ty = y0 + y;
      if (key !== "." && ty >= 0 && ty < target.length && tx >= 0 && tx < target[0].length) target[ty][tx] = key;
    });
  });
}
function rect(target, x0, y0, w, h, key) {
  for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) if (target[y] && x >= 0 && x < target[0].length) target[y][x] = key;
}

function toSvg(cells, { title, className = "px-art" } = {}) {
  const height = cells.length;
  const width = cells[0].length;
  const byColor = new Map();
  cells.forEach((row, y) => {
    let x = 0;
    while (x < width) {
      const key = row[x];
      if (key === ".") { x += 1; continue; }
      let run = 1;
      while (x + run < width && row[x + run] === key) run += 1;
      const list = byColor.get(key) || [];
      list.push(`M${x} ${y}h${run}v1h-${run}z`);
      byColor.set(key, list);
      x += run;
    }
  });
  const paths = [...byColor].map(([key, d]) => `<path fill="${PALETTE[key]}" d="${d.join("")}"/>`).join("");
  const label = title ? ` role="img" aria-label="${title}"` : ` aria-hidden="true"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" viewBox="0 0 ${width} ${height}" width="${width * 4}" height="${height * 4}" shape-rendering="crispEdges"${label}>${title ? `<title>${title}</title>` : ""}${paths}</svg>\n`;
}
const spriteCells = (sprite) => grid(sprite).map((row) => [...row]);

// 5 x 7 pixel font for the share card.
const FONT = {
  A: ["01110","10001","10001","11111","10001","10001","10001"],
  B: ["11110","10001","10001","11110","10001","10001","11110"],
  C: ["01111","10000","10000","10000","10000","10000","01111"],
  D: ["11110","10001","10001","10001","10001","10001","11110"],
  E: ["11111","10000","10000","11110","10000","10000","11111"],
  F: ["11111","10000","10000","11110","10000","10000","10000"],
  G: ["01111","10000","10000","10111","10001","10001","01111"],
  H: ["10001","10001","10001","11111","10001","10001","10001"],
  I: ["11111","00100","00100","00100","00100","00100","11111"],
  J: ["00111","00010","00010","00010","10010","10010","01100"],
  K: ["10001","10010","10100","11000","10100","10010","10001"],
  L: ["10000","10000","10000","10000","10000","10000","11111"],
  M: ["10001","11011","10101","10101","10001","10001","10001"],
  N: ["10001","11001","10101","10011","10001","10001","10001"],
  O: ["01110","10001","10001","10001","10001","10001","01110"],
  P: ["11110","10001","10001","11110","10000","10000","10000"],
  Q: ["01110","10001","10001","10001","10101","10010","01101"],
  R: ["11110","10001","10001","11110","10100","10010","10001"],
  S: ["01111","10000","10000","01110","00001","00001","11110"],
  T: ["11111","00100","00100","00100","00100","00100","00100"],
  U: ["10001","10001","10001","10001","10001","10001","01110"],
  V: ["10001","10001","10001","10001","10001","01010","00100"],
  W: ["10001","10001","10001","10101","10101","10101","01010"],
  X: ["10001","10001","01010","00100","01010","10001","10001"],
  Y: ["10001","10001","01010","00100","00100","00100","00100"],
  Z: ["11111","00001","00010","00100","01000","10000","11111"],
  0: ["01110","10011","10101","10101","11001","10001","01110"],
  1: ["00100","01100","00100","00100","00100","00100","01110"],
  2: ["01110","10001","00001","00010","00100","01000","11111"],
  3: ["11110","00001","00001","01110","00001","00001","11110"],
  4: ["00010","00110","01010","10010","11111","00010","00010"],
  5: ["11111","10000","11110","00001","00001","10001","01110"],
  6: ["00110","01000","10000","11110","10001","10001","01110"],
  7: ["11111","00001","00010","00100","01000","01000","01000"],
  8: ["01110","10001","10001","01110","10001","10001","01110"],
  9: ["01110","10001","10001","01111","00001","00010","01100"],
  $: ["00100","01111","10100","01110","00101","11110","00100"],
  ".": ["00000","00000","00000","00000","00000","01100","01100"],
  ",": ["00000","00000","00000","00000","01100","00100","01000"],
  "-": ["00000","00000","00000","11111","00000","00000","00000"],
  "/": ["00001","00010","00010","00100","01000","01000","10000"],
  "+": ["00000","00100","00100","11111","00100","00100","00000"],
  ">": ["01000","00100","00010","00001","00010","00100","01000"],
  ":": ["00000","01100","01100","00000","01100","01100","00000"],
  " ": ["00000","00000","00000","00000","00000","00000","00000"],
};
function text(target, value, x0, y0, key, scale = 1) {
  let x = x0;
  for (const char of value.toUpperCase()) {
    const glyph = FONT[char] || FONT[" "];
    glyph.forEach((row, gy) => [...row].forEach((bit, gx) => {
      if (bit === "1") rect(target, x + gx * scale, y0 + gy * scale, scale, scale, key);
    }));
    x += 6 * scale;
  }
  return x;
}
const textWidth = (value, scale = 1) => value.length * 6 * scale - scale;

// The land map: coast on the west, fields running inland, the Exchange in the middle.
const MAP = [
  "WWSFCRRFHFCRFHF",
  "WWSFRXXRFCFRCFR",
  "WWSPPXXPPPPPPPP",
  "WWSFCRRFHFRCFCF",
];
const TILE_FOR = { W: "water", S: "sand", F: "field", C: "crops", R: "rows", H: "hills", P: "path", X: "path" };

function scene({ width, height, mapTop, cols, rows, tileOffsetX = 0 }) {
  const cells = canvas(width, height, "C");
  rect(cells, 0, mapTop - 6, width, 6, "w");
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const key = (MAP[r % MAP.length] || "")[(c + tileOffsetX) % MAP[0].length] || "F";
      stamp(cells, TILE[TILE_FOR[key]], c * 16, mapTop + r * 16);
    }
  }
  // Plot lines: the thin ink fence that turns land into lots.
  for (let c = 1; c < cols; c += 1) for (let y = mapTop; y < mapTop + rows * 16; y += 2) if (c > 2) cells[y][c * 16] = "g";
  for (let r = 1; r < rows; r += 1) for (let x = 48; x < width; x += 2) cells[mapTop + r * 16][x] = "g";
  return cells;
}

const heroCells = scene({ width: 160, height: 104, mapTop: 40, cols: 10, rows: 4 });
stamp(heroCells, SUN, 130, 6);
stamp(heroCells, CLOUD, 18, 10);
stamp(heroCells, CLOUD, 78, 18);
stamp(heroCells, EXCHANGE, 80, 40);
stamp(heroCells, MULE, 48, 64);
stamp(heroCells, BUILDER, 116, 68);
stamp(heroCells, CRATE, 130, 72);

// Share card: 240 x 126 at 5x = 1200 x 630.
const shareCells = scene({ width: 240, height: 126, mapTop: 62, cols: 15, rows: 4 });
rect(shareCells, 0, 0, 240, 56, "K");
for (let x = 0; x < 240; x += 4) { shareCells[56][x] = "Y"; shareCells[56][x + 1] = "Y"; }
let after = text(shareCells, "INDUSTRY", 10, 8, "W", 2);
text(shareCells, "NEXT", after + 8, 8, "Y", 2);
text(shareCells, "AI BUILD STUDIO / EL SEGUNDO", 10, 28, "C", 1);
text(shareCells, "$350 SESSION > $50K STARTER KIT", 10, 40, "W", 1);
stamp(shareCells, SUN, 220, 8);
stamp(shareCells, EXCHANGE, 128, 62);
stamp(shareCells, MULE, 64, 92);
stamp(shareCells, BUILDER, 176, 94);
stamp(shareCells, CRATE, 192, 98);

function png(cells, scale) {
  const width = cells[0].length * scale;
  const height = cells.length * scale;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 3 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const key = cells[Math.floor(y / scale)][Math.floor(x / scale)];
      const [r, g, b] = rgb(PALETTE[key === "." ? "C" : key]);
      raw.set([r, g, b], rowStart + 1 + x * 3);
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => { let c = 0xffffffff; for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir(artDir, { recursive: true });
const files = {
  "mule.svg": toSvg(spriteCells(MULE), { title: "A pixel pack mule in red noggles, carrying crates" }),
  "builder.svg": toSvg(spriteCells(BUILDER), { title: "A pixel builder in a hard hat and noggles" }),
  "exchange.svg": toSvg(spriteCells(EXCHANGE), { title: "The Exchange, a pixel market hall with a red flag" }),
  "crate.svg": toSvg(spriteCells(CRATE)),
  "cart.svg": toSvg(spriteCells(CART)),
  "silo.svg": toSvg(spriteCells(SILO)),
  "tower.svg": toSvg(spriteCells(TOWER)),
  "scene.svg": toSvg(heroCells, { title: "Pixel map of the coast: ocean, sand, fenced plots of land, the Exchange market hall, a pack mule in noggles and a builder with a crate", className: "px-scene" }),
};
for (const [name, body] of Object.entries(files)) await writeFile(resolve(artDir, name), body);
await writeFile(resolve(root, "public/homepage/industry-next-8bit-share.png"), png(shareCells, 5));
if (process.argv.includes("--preview")) {
  await writeFile(resolve(process.argv[process.argv.indexOf("--preview") + 1], "scene-preview.png"), png(heroCells, 6));
  for (const [name, sprite] of Object.entries({ MULE, BUILDER, EXCHANGE, CART, SILO, TOWER })) {
    await writeFile(resolve(process.argv[process.argv.indexOf("--preview") + 1], `${name.toLowerCase()}.png`), png(spriteCells(sprite), 12));
  }
}
console.log(`8-bit art: ${Object.keys(files).length} SVGs + share PNG (${textWidth("INDUSTRY NEXT", 2)}px title)`);
