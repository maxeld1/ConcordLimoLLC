// /js/partials.js
(function () {
  "use strict";

  const INCLUDE_ATTR = "data-include";
  const PARTIALS_DIR = "partials";

  // If we're on a page under /pages/, prefix should be "../"
  const isSubpage = location.pathname.includes("/pages/");
  const P = isSubpage ? "../" : "";

  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    return await res.text();
  }

  function applyPrefixPlaceholders(html) {
    return html.replaceAll("{{P}}", P);
  }

  async function inject(targetSelector, file) {
    const mount = document.querySelector(targetSelector);
    if (!mount) return;

    const url = `${P}${PARTIALS_DIR}/${file}`; // works from / and /pages/
    try {
      const raw = await fetchText(url);
      const html = applyPrefixPlaceholders(raw);
      mount.outerHTML = html;
    } catch (err) {
      console.error("Include failed:", url, err);
    }
  }

  async function run() {
    await inject(`[${INCLUDE_ATTR}="header"]`, "header.html");
    await inject(`[${INCLUDE_ATTR}="footer"]`, "footer.html");

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  if (document.readyState !== "loading") run();
  else document.addEventListener("DOMContentLoaded", run);
})();
