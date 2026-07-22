export const PALETTE_COLORS = {
  signal: { background: "#f2b705", ink: "#171515", accent: "#f24824" },
  garden: { background: "#dafa45", ink: "#171515", accent: "#376f51" },
  paper: { background: "#fff8e9", ink: "#171515", accent: "#3b62f2" },
  night: { background: "#171515", ink: "#fff8e9", accent: "#dafa45" },
  civic: { background: "#3b62f2", ink: "#fff8e9", accent: "#f24824" },
  candy: { background: "#ff8fcb", ink: "#171515", accent: "#3b62f2" },
};

export const MODE_LABELS = {
  sign: "Public sign",
  club: "Small club",
  tool: "Useful tool",
  character: "New character",
  ritual: "Shared ritual",
  institution: "Tiny institution",
};

export function nounUrl(seed) {
  const params = new URLSearchParams(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  return `/api/noun?${params}`;
}

export function createPoster(entry, size = "full") {
  const poster = document.createElement("div");
  poster.className = "lab-poster";
  poster.dataset.palette = entry.palette;

  const meta = document.createElement("div");
  meta.className = "poster-meta";
  const mode = document.createElement("span");
  mode.textContent = MODE_LABELS[entry.mode] || entry.mode;
  const credit = document.createElement("span");
  credit.textContent = entry.maker ? `by ${entry.maker}` : "made in public";
  meta.append(mode, credit);

  const noun = document.createElement("img");
  noun.className = "poster-noun";
  noun.src = nounUrl(entry.seed);
  noun.alt = size === "feed" ? `A Noun used in ${entry.message}` : "Your selected Noun";

  const message = document.createElement("p");
  message.className = "poster-message";
  message.textContent = entry.message;
  poster.append(meta, noun, message);
  return poster;
}

export function secureRandom(max) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
}
