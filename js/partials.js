// /js/partials.js
(() => {
  "use strict";

  const INCLUDE_ATTR = "data-include";
  const PARTIALS_DIR = "partials";

  // Compute prefix so includes work from nested folders:
  // "/"           -> P = ""
  // "/services/"  -> P = "../"
  // "/contact/"   -> P = "../"
  // "/pages/x/"   -> P = "../../" (if you ever keep a /pages/ layer)
  const path = location.pathname;
  const depth = path.replace(/\/$/, "").split("/").length - 1; // "/" => 0, "/services" => 1
  const P = depth === 0 ? "" : "../".repeat(depth);

  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    return await res.text();
  }

  function applyPrefixPlaceholders(html) {
    // Use {{P}} inside partials for links/assets:
    // <img src="{{P}}assets/images/logo.png">
    // <a href="{{P}}services/">Services</a>
    return html.replaceAll("{{P}}", P);
  }

  async function injectOne(placeholderEl) {
    const name = placeholderEl.getAttribute(INCLUDE_ATTR); // "header" or "footer"
    if (!name) return null;

    const url = `${P}${PARTIALS_DIR}/${name}.html`;
    const raw = await fetchText(url);
    const html = applyPrefixPlaceholders(raw);

    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    placeholderEl.replaceWith(tpl.content);

    return { name, url };
  }

  async function injectAll() {
    const placeholders = Array.from(document.querySelectorAll(`[${INCLUDE_ATTR}]`));
    const injected = [];

    for (const el of placeholders) {
      try {
        const info = await injectOne(el);
        if (info) injected.push(info);
      } catch (err) {
        console.error(`Include failed: ${el.getAttribute(INCLUDE_ATTR)}`, err);
      }
    }

    // Footer year (after footer is injected)
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Expose prefix (optional)
    window.__P = P;

    // Let other scripts know partials are ready
    document.dispatchEvent(
        new CustomEvent("partials:loaded", { detail: { prefix: P, injected } })
    );

    return injected;
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn, { once: true });
  }

  ready(() => {
    injectAll();
  });
})();
