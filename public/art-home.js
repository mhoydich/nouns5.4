import { CURRENT_STUDIO, STARTER_WORKS } from "/lib/open-studios.js";

const stage = document.querySelector("[data-voxel-stage]");
const canvas = document.querySelector("#voxel-canvas");
const fallback = document.querySelector("#voxel-fallback");
const remixButton = document.querySelector("#remix-sculpture");
const sceneStatus = document.querySelector("#scene-status");
const madeGrid = document.querySelector("#home-made-grid");

const seeds = [
  { background: 1, body: 4, accessory: 26, head: 89, glasses: 3 },
  { background: 0, body: 12, accessory: 87, head: 154, glasses: 15 },
  { background: 1, body: 27, accessory: 119, head: 211, glasses: 6 },
  { background: 0, body: 18, accessory: 46, head: 42, glasses: 20 },
  { background: 1, body: 8, accessory: 132, head: 235, glasses: 9 },
];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const compactDevice = window.matchMedia("(max-width: 700px)").matches;
let seedIndex = 0;
let renderer = null;

function nounUrl(seed) {
  const params = new URLSearchParams(Object.entries(seed));
  return `/api/noun?${params}`;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "WebGL shader compilation failed.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, `
    attribute vec3 aPosition;
    attribute vec3 aColor;
    attribute vec3 aNormal;
    uniform mat4 uMvp;
    uniform mat4 uModel;
    varying vec3 vColor;
    varying float vLight;
    varying float vDepth;
    void main() {
      vec3 normal = normalize(mat3(uModel) * aNormal);
      vec3 lightA = normalize(vec3(-0.45, 0.72, 0.8));
      vec3 lightB = normalize(vec3(0.8, -0.4, 0.45));
      float key = max(dot(normal, lightA), 0.0);
      float fill = max(dot(normal, lightB), 0.0);
      vLight = 0.48 + key * 0.47 + fill * 0.12;
      vColor = aColor;
      vec4 position = uMvp * vec4(aPosition, 1.0);
      vDepth = position.z / position.w;
      gl_Position = position;
    }
  `);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec3 vColor;
    varying float vLight;
    varying float vDepth;
    void main() {
      float haze = smoothstep(0.35, 0.96, vDepth) * 0.16;
      vec3 lit = vColor * vLight;
      gl_FragColor = vec4(mix(lit, vec3(0.933, 1.0, 0.255), haze), 1.0);
    }
  `);

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "WebGL program linking failed.";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function multiply4(a, b) {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] =
        a[row] * b[column * 4] +
        a[4 + row] * b[column * 4 + 1] +
        a[8 + row] * b[column * 4 + 2] +
        a[12 + row] * b[column * 4 + 3];
    }
  }
  return out;
}

function identity4() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function perspective4(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const range = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * range, -1,
    0, 0, near * far * range * 2, 0,
  ]);
}

function translate4(x, y, z) {
  const out = identity4();
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
}

function rotateX4(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

function rotateY4(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

function rotateZ4(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function pushQuad(target, corners, color, normal) {
  const order = [0, 1, 2, 0, 2, 3];
  for (const index of order) {
    target.positions.push(...corners[index]);
    target.colors.push(...color);
    target.normals.push(...normal);
  }
}

function buildVoxelMesh(image) {
  const sample = document.createElement("canvas");
  sample.width = 32;
  sample.height = 32;
  const context = sample.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, 32, 32);
  const pixels = context.getImageData(0, 0, 32, 32).data;
  const background = [pixels[0], pixels[1], pixels[2]];
  const depths = new Float32Array(32 * 32);
  const colors = new Array(32 * 32);

  for (let y = 0; y < 32; y += 1) {
    for (let x = 0; x < 32; x += 1) {
      const pixel = (y * 32 + x) * 4;
      const color = [pixels[pixel] / 255, pixels[pixel + 1] / 255, pixels[pixel + 2] / 255];
      const distance = Math.abs(pixels[pixel] - background[0]) + Math.abs(pixels[pixel + 1] - background[1]) + Math.abs(pixels[pixel + 2] - background[2]);
      depths[y * 32 + x] = distance < 8 ? 0.1 : 0.42;
      colors[y * 32 + x] = color;
    }
  }

  const mesh = { positions: [], colors: [], normals: [] };
  const size = 2 / 32;
  const depthAt = (x, y) => (x < 0 || x >= 32 || y < 0 || y >= 32 ? 0 : depths[y * 32 + x]);

  for (let y = 0; y < 32; y += 1) {
    for (let x = 0; x < 32; x += 1) {
      const depth = depthAt(x, y);
      const color = colors[y * 32 + x];
      const x0 = -1 + x * size;
      const x1 = x0 + size;
      const y1 = 1 - y * size;
      const y0 = y1 - size;
      const z0 = -0.2;
      const z1 = z0 + depth;

      pushQuad(mesh, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], color, [0, 0, 1]);

      const leftDepth = depthAt(x - 1, y);
      if (depth > leftDepth) pushQuad(mesh, [[x0, y0, z0 + leftDepth], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0 + leftDepth]], color, [-1, 0, 0]);
      const rightDepth = depthAt(x + 1, y);
      if (depth > rightDepth) pushQuad(mesh, [[x1, y0, z1], [x1, y0, z0 + rightDepth], [x1, y1, z0 + rightDepth], [x1, y1, z1]], color, [1, 0, 0]);
      const topDepth = depthAt(x, y - 1);
      if (depth > topDepth) pushQuad(mesh, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0 + topDepth], [x0, y1, z0 + topDepth]], color, [0, 1, 0]);
      const bottomDepth = depthAt(x, y + 1);
      if (depth > bottomDepth) pushQuad(mesh, [[x0, y0, z0 + bottomDepth], [x1, y0, z0 + bottomDepth], [x1, y0, z1], [x0, y0, z1]], color, [0, -1, 0]);
    }
  }

  pushQuad(mesh, [[-1, -1, -0.205], [-1, 1, -0.205], [1, 1, -0.205], [1, -1, -0.205]], [0.035, 0.035, 0.035], [0, 0, -1]);
  return mesh;
}

function createRenderer() {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: !compactDevice,
    depth: true,
    powerPreference: compactDevice ? "low-power" : "high-performance",
    preserveDrawingBuffer: false,
  });
  if (!gl) throw new Error("WebGL is not available.");

  const program = createProgram(gl);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stage.classList.remove("is-webgl");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    renderer = null;
    loadSculpture(seeds[seedIndex]);
  }, { once: true });
  const locations = {
    position: gl.getAttribLocation(program, "aPosition"),
    color: gl.getAttribLocation(program, "aColor"),
    normal: gl.getAttribLocation(program, "aNormal"),
    mvp: gl.getUniformLocation(program, "uMvp"),
    model: gl.getUniformLocation(program, "uModel"),
  };
  const buffers = [gl.createBuffer(), gl.createBuffer(), gl.createBuffer()];
  let vertexCount = 0;
  let rotationX = compactDevice ? -0.08 : -0.13;
  let rotationY = compactDevice ? -0.2 : 0.2;
  let targetX = rotationX;
  let targetY = rotationY;
  let hasDragged = false;
  let active = true;
  let dragging = false;
  let pointerX = 0;
  let pointerY = 0;
  let lastTime = performance.now();
  let frame = 0;

  function upload(index, location, data) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[index]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
  }

  function setMesh(mesh) {
    vertexCount = mesh.positions.length / 3;
    gl.useProgram(program);
    upload(0, locations.position, mesh.positions);
    upload(1, locations.color, mesh.colors);
    upload(2, locations.normal, mesh.normals);
    draw(performance.now(), true);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, compactDevice ? 1.25 : 1.75);
    const width = Math.max(1, Math.round(bounds.width * pixelRatio));
    const height = Math.max(1, Math.round(bounds.height * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function draw(now, force = false) {
    if ((!active || document.hidden) && !force) return;
    resize();
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (!reduceMotion && !dragging && !hasDragged) {
      targetY = (compactDevice ? -0.14 : 0.18) + Math.sin(now * 0.00042) * 0.22;
    }
    rotationX += (targetX - rotationX) * (force ? 1 : 0.085);
    rotationY += (targetY - rotationY) * (force ? 1 : 0.085);

    const aspect = canvas.width / canvas.height;
    const projection = perspective4(Math.PI * (compactDevice ? 0.26 : 0.23), aspect, 0.1, 10);
    const view = translate4(0, compactDevice ? -0.03 : 0, compactDevice ? -3.22 : -3.05);
    let model = multiply4(rotateY4(rotationY), rotateX4(rotationX));
    model = multiply4(rotateZ4(-0.035), model);
    const mvp = multiply4(projection, multiply4(view, model));

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.useProgram(program);
    gl.uniformMatrix4fv(locations.mvp, false, mvp);
    gl.uniformMatrix4fv(locations.model, false, model);
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    if (!reduceMotion) frame = requestAnimationFrame(draw);
  }

  function requestDraw() {
    if (reduceMotion) draw(performance.now(), true);
  }

  stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, a")) return;
    dragging = true;
    hasDragged = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - pointerX;
    const dy = event.clientY - pointerY;
    pointerX = event.clientX;
    pointerY = event.clientY;
    targetY = Math.max(-1.05, Math.min(1.05, targetY + dx * 0.008));
    targetX = Math.max(-0.72, Math.min(0.72, targetX + dy * 0.006));
    requestDraw();
  });
  const release = (event) => {
    dragging = false;
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  window.addEventListener("resize", requestDraw, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !reduceMotion) {
      cancelAnimationFrame(frame);
      lastTime = performance.now();
      frame = requestAnimationFrame(draw);
    }
  });
  new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active && !reduceMotion) {
      cancelAnimationFrame(frame);
      lastTime = performance.now();
      frame = requestAnimationFrame(draw);
    }
  }, { rootMargin: "120px" }).observe(stage);

  if (!reduceMotion) frame = requestAnimationFrame(draw);
  return { setMesh };
}

async function loadSculpture(seed, announce = false) {
  const url = nounUrl(seed);
  fallback.src = url;
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  try {
    await image.decode();
    if (!renderer) renderer = createRenderer();
    renderer.setMesh(buildVoxelMesh(image));
    stage.classList.add("is-webgl");
    if (announce) sceneStatus.textContent = `New voxel Noun sculpture ${seedIndex + 1} of ${seeds.length}.`;
  } catch (error) {
    stage.classList.remove("is-webgl");
    if (announce) sceneStatus.textContent = "A new Noun poster is showing in the lightweight view.";
    console.info("The 3D sculpture is using its image fallback.", error);
  }
}

remixButton.addEventListener("click", () => {
  seedIndex = (seedIndex + 1) % seeds.length;
  loadSculpture(seeds[seedIndex], true);
});

function madeCard(entry, index) {
  const article = document.createElement("article");
  article.className = "home-made-card";
  const poster = document.createElement("div");
  poster.className = "home-made-poster";
  const form = document.createElement("span");
  form.textContent = `${String(index + 1).padStart(2, "0")} / ${entry.mode || "object"}`;
  const image = document.createElement("img");
  image.src = nounUrl(entry.seed);
  image.alt = "";
  image.width = 320;
  image.height = 320;
  image.loading = "lazy";
  const message = document.createElement("strong");
  message.textContent = entry.message;
  poster.append(form, image, message);
  const meta = document.createElement("div");
  meta.className = "home-made-meta";
  const maker = document.createElement("span");
  maker.textContent = entry.maker || "Anonymous";
  const time = document.createElement("time");
  if (entry.createdAt) time.dateTime = entry.createdAt;
  time.textContent = entry.createdAt
    ? new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "Studio starter";
  meta.append(maker, time);
  const action = document.createElement("div");
  action.className = "home-made-action";
  const edition = document.createElement("span");
  edition.textContent = "Open Studio 002";
  const remix = document.createElement("a");
  remix.href = entry.isStarter
    ? `/make/?starter=${encodeURIComponent(entry.id)}`
    : `/make/?remix=${encodeURIComponent(entry.id)}`;
  remix.textContent = entry.isStarter ? "Begin here ↗" : "Remix this ↗";
  action.append(edition, remix);
  article.append(poster, meta, action);
  return article;
}

function currentStudioSelection(entries) {
  const current = entries.filter((entry) => entry.edition === CURRENT_STUDIO.id);
  const messages = new Set(current.map((entry) => entry.message.toLowerCase()));
  const pool = [...current, ...STARTER_WORKS.filter((entry) => !messages.has(entry.message.toLowerCase()))];
  const offset = Math.floor(Date.now() / 86_400_000) % pool.length;
  return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, 3);
}

async function loadMade() {
  try {
    const response = await fetch("/api/made?limit=12", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Made feed is unavailable.");
    const { entries } = await response.json();
    if (!Array.isArray(entries)) throw new Error("Made feed is unavailable.");
    madeGrid.replaceChildren(...currentStudioSelection(entries).map(madeCard));
  } catch {
    const first = madeGrid.querySelector(".made-placeholder span");
    const message = madeGrid.querySelector(".made-placeholder strong");
    if (first) first.textContent = "OPEN TABLE";
    if (message) message.textContent = "MAKE THE FIRST THING";
  }
}

loadSculpture(seeds[seedIndex]);
loadMade();
