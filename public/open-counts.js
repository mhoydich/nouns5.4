// Open counts for industrynext.xyz. No cookies, no storage beyond a random id for this tab.
// Skipped when the browser sends Do Not Track or Global Privacy Control.
(() => {
  const nav = navigator;
  if (nav.globalPrivacyControl === true || nav.doNotTrack === "1" || window.doNotTrack === "1") return;
  const path = location.pathname.replace(/\/index\.html$/, "/");
  const post = (url, body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {});
  let id;
  try { id = sessionStorage.getItem("here-id"); } catch {}
  if (!id || !/^[a-f0-9]{32}$/.test(id)) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    id = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    try { sessionStorage.setItem("here-id", id); } catch {}
  }
  const fill = (selector, text) => document.querySelectorAll(selector).forEach((el) => { el.textContent = text; el.hidden = false; });
  const checkIn = () => post("/api/present", { p: path, id });
  const showHere = () => fetch("/api/present").then((r) => r.json()).then((d) => {
    if (Number.isSafeInteger(d.total)) fill("[data-here-now]", `${d.total} here now`);
  }).catch(() => {});
  post("/api/views", { p: path }).then(() => fetch(`/api/views?days=7&path=${encodeURIComponent(path)}`)).then((r) => r && r.json()).then((d) => {
    if (d && Number.isSafeInteger(d.views)) fill("[data-page-views]", `This page: ${d.views} ${d.views === 1 ? "view" : "views"} this week`);
  }).catch(() => {});
  checkIn().then(showHere);
  setInterval(() => { if (document.visibilityState === "visible") checkIn().then(showHere); }, 60000);
})();
