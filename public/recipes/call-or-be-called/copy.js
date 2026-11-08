// AI Recipes 001: copy a recipe card as plain text. No network, no storage.
(() => {
  const text = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const asPlain = (card) => {
    const lines = [text(card.querySelector("h3")), text(card.querySelector(".level")), ""];
    card.querySelectorAll(".recipe-body > div").forEach((col) => {
      lines.push(text(col.querySelector("h4")));
      col.querySelectorAll("li").forEach((li, i) => {
        lines.push((col.querySelector("ol") ? `${i + 1}. ` : "- ") + text(li));
      });
      lines.push("");
    });
    lines.push(text(card.querySelector(".watch")));
    lines.push("", `From AI Recipes 001, Industry Next: ${location.origin}${location.pathname}#${card.id}`);
    return lines.join("\n");
  };
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const card = btn.closest("[data-recipe]");
    const label = btn.textContent;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(asPlain(card));
        btn.textContent = "★ COPIED";
      } catch {
        btn.textContent = "SELECT + COPY";
      }
      setTimeout(() => { btn.textContent = label; }, 1800);
    });
  });
})();
