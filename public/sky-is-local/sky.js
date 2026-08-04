const pacificDateTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const pacificTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

const passList = document.querySelector("#pass-list");
const feedState = document.querySelector("#feed-state");
const nextPassLabel = document.querySelector("#next-pass-label");
const nextPassCountdown = document.querySelector("#next-pass-countdown");
const nextPassName = document.querySelector("#next-pass-name");
const nextPassPeak = document.querySelector("#next-pass-peak");
const nextPassWindow = document.querySelector("#next-pass-window");
const modelTimestamp = document.querySelector("#model-timestamp");
const stageTime = document.querySelector("#stage-time");
const skyInstrument = document.querySelector("#sky-instrument");
const bloomField = document.querySelector("#bloom-field");
const startSound = document.querySelector("#start-sound");
const packetTape = document.querySelector("#packet-tape");
const packetCount = document.querySelector("#packet-count");
const packetStatus = document.querySelector("#packet-status");

let passes = [];
let audioContext;
let soundMode = "bell";
let bloomCount = 0;

function pad(value) {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}

function durationLabel(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours ? `${pad(hours)}:${pad(minutes)}:${pad(remainder)}` : `${pad(minutes)}:${pad(remainder)}`;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function definition(term, description) {
  const row = element("div");
  row.append(element("dt", "", term), element("dd", "", description));
  return row;
}

function renderPasses() {
  passList.replaceChildren();
  passList.setAttribute("aria-busy", "false");

  if (!passes.length) {
    const card = element("article", "pass-placeholder");
    card.append(
      element("span", "", "SKY FEED RESTING"),
      element("strong", "", "THE REHEARSAL STILL WORKS"),
      element("p", "", "Tap the sky to make a local bloom. No orbital window is being claimed right now."),
    );
    passList.append(card);
    return;
  }

  passes.slice(0, 8).forEach((pass, index) => {
    const card = element("article", "pass-card");
    const details = element("dl");
    details.append(
      definition("RISE", pacificDateTime.format(new Date(pass.riseAt))),
      definition("PEAK", `${pass.maxElevationDegrees}° ${pass.peakDirection}`),
      definition("WINDOW", `${Math.round(pass.durationSeconds / 60)} min above 10°`),
      definition("RANGE", `~${pass.peakRangeKm.toLocaleString("en-US")} km at peak`),
    );
    card.append(
      element("span", "", `PASS ${pad(index + 1)} / PREDICTED`),
      element("h3", "", pass.satellite),
      element("p", "pass-kind", pass.kind),
      details,
    );
    passList.append(card);
  });
}

function currentPass(now = new Date()) {
  return passes.find((pass) => new Date(pass.setAt) >= now);
}

function refreshCountdown() {
  const now = new Date();
  stageTime.textContent = `PACIFIC SKY / ${pacificTime.format(now)}`;
  const pass = currentPass(now);
  if (!pass) {
    nextPassCountdown.textContent = "— — : — — : — —";
    nextPassLabel.textContent = passes.length ? "No more modeled passes in this window." : "The orbital feed is resting. The instrument is ready.";
    return;
  }

  const rise = new Date(pass.riseAt);
  const set = new Date(pass.setAt);
  const isOverhead = rise <= now;
  nextPassLabel.textContent = isOverhead ? `Modeled above 10° now / ${pass.satellite}` : `Next modeled pass / ${pass.satellite}`;
  nextPassCountdown.textContent = `${isOverhead ? "OVERHEAD " : "T−"}${durationLabel((isOverhead ? set : rise) - now)}`;
  nextPassName.textContent = pass.satellite;
  nextPassPeak.textContent = `${pass.maxElevationDegrees}° ${pass.peakDirection}`;
  nextPassWindow.textContent = `${pacificTime.format(rise)}–${pacificTime.format(set)}`;
}

async function loadPasses() {
  try {
    const response = await fetch("/api/sky-pass", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Sky feed returned ${response.status}.`);
    const feed = await response.json();
    passes = Array.isArray(feed.passes) ? feed.passes : [];
    feedState.dataset.state = feed.status;
    feedState.textContent = feed.status === "partial" ? "LIVE SKY MODEL / PARTIAL" : "LIVE SKY MODEL / PREDICTED";
    modelTimestamp.textContent = `MODEL GENERATED / ${pacificDateTime.format(new Date(feed.generatedAt))} PT`;
  } catch (error) {
    passes = [];
    feedState.dataset.state = "resting";
    feedState.textContent = "SKY FEED / RESTING";
    modelTimestamp.textContent = "MODEL STATUS / UNAVAILABLE — SOUND REHEARSAL READY";
    console.warn(error instanceof Error ? error.message : "The sky feed is resting.");
  }
  renderPasses();
  refreshCountdown();
}

function createBloom(clientX, clientY) {
  const bounds = skyInstrument.getBoundingClientRect();
  const bloom = element("i", "bloom");
  const fallbackX = bounds.width * (0.35 + Math.random() * 0.3);
  const fallbackY = bounds.height * (0.2 + Math.random() * 0.35);
  bloom.style.left = `${Number.isFinite(clientX) ? clientX - bounds.left : fallbackX}px`;
  bloom.style.top = `${Number.isFinite(clientY) ? clientY - bounds.top : fallbackY}px`;
  bloomField.append(bloom);
  window.setTimeout(() => bloom.remove(), 1600);
  bloomCount += 1;
  packetCount.textContent = `${String(bloomCount).padStart(3, "0")} BLOOMS`;
}

function ensureAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ||= new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(offset = 0, pitchShift = 0) {
  const context = ensureAudio();
  if (!context) {
    startSound.textContent = "Sound is unavailable here / visual blooms remain ready";
    return;
  }

  const startsAt = context.currentTime + offset;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const recipes = {
    bell: { wave: "sine", frequency: 523.25, duration: 1.35, filter: 4200 },
    bloom: { wave: "triangle", frequency: 261.63, duration: 1.8, filter: 1600 },
    air: { wave: "sine", frequency: 174.61, duration: 2.3, filter: 900 },
  };
  const recipe = recipes[soundMode];
  oscillator.type = recipe.wave;
  oscillator.frequency.setValueAtTime(recipe.frequency * (2 ** (pitchShift / 12)), startsAt);
  oscillator.frequency.exponentialRampToValueAtTime(recipe.frequency * 1.018 * (2 ** (pitchShift / 12)), startsAt + recipe.duration);
  filter.type = "lowpass";
  filter.frequency.value = recipe.filter;
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(soundMode === "air" ? 0.075 : 0.14, startsAt + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + recipe.duration);
  oscillator.connect(filter).connect(gain).connect(context.destination);
  oscillator.start(startsAt);
  oscillator.stop(startsAt + recipe.duration + 0.05);
  skyInstrument.dataset.sound = "on";
  startSound.textContent = `${soundMode} mode / local synth is awake`;
}

function addPacketReceipt() {
  const firstReady = packetTape.querySelector("li span");
  if (firstReady?.textContent === "READY") packetTape.replaceChildren();
  const item = element("li");
  const sequence = String(packetTape.children.length + 1).padStart(3, "0");
  item.append(
    element("span", "", `SIM ${sequence}`),
    element("strong", "", `${soundMode.toUpperCase()} PACKET BLOOM / REHEARSED`),
    element("small", "", `${pacificTime.format(new Date())} PT · browser synth · no radio source`),
  );
  packetTape.prepend(item);
  while (packetTape.children.length > 8) packetTape.lastElementChild.remove();
  packetStatus.textContent = `Simulated packet ${sequence} rehearsed. No radio was connected.`;
}

function activateSky(event) {
  createBloom(event.clientX, event.clientY);
  playTone(0, Math.floor(Math.random() * 8) - 2);
}

skyInstrument.addEventListener("click", activateSky);
skyInstrument.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  activateSky(event);
});

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    soundMode = button.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === button));
    });
    packetStatus.textContent = `${soundMode} mode selected.`;
  });
});

document.querySelector("#rehearse-packet").addEventListener("click", () => {
  [0, 0.18, 0.41, 0.72].forEach((offset, index) => {
    playTone(offset, [0, 4, 7, 12][index]);
    window.setTimeout(() => createBloom(), offset * 1000);
  });
  addPacketReceipt();
});

document.querySelector("#print-score").addEventListener("click", () => window.print());

refreshCountdown();
window.setInterval(refreshCountdown, 1000);
loadPasses();
