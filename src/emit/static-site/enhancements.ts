import path from "node:path";
import fs from "node:fs/promises";

type EnhancementCaps = {
  sidebarToggle: boolean;
  copyCode: boolean;
  themeToggle: boolean;
  tocScrollSpy: boolean;
  search: boolean;
  mermaid: boolean;
};

function buildEnhancementsJs(caps: EnhancementCaps) {
  return `
(() => {
  const root = document.documentElement;
  const CAP_SIDEBAR = ${caps.sidebarToggle};
  const CAP_COPY = ${caps.copyCode};
  const CAP_THEME = ${caps.themeToggle};
  const CAP_TOC = ${caps.tocScrollSpy};
  const CAP_SEARCH = ${caps.search};
  const CAP_MERMAID = ${caps.mermaid};

  function on(el, ev, fn) {
    if (!el) return;
    el.addEventListener(ev, fn);
  }

  function toggleSidebar(btn) {
    const isCollapsed = root.getAttribute("data-irgen-sidebar") === "collapsed";
    const next = isCollapsed ? "" : "collapsed";
    if (next) root.setAttribute("data-irgen-sidebar", next);
    else root.removeAttribute("data-irgen-sidebar");
    btn.setAttribute("aria-expanded", String(!isCollapsed));
  }

  function setupSidebarToggle() {
    const btn = document.querySelector("[data-irgen-sidebar-toggle]");
    on(btn, "click", () => toggleSidebar(btn));
  }

  function readThemePref() {
    try {
      return localStorage.getItem("irgen-theme");
    } catch (_) {
      return null;
    }
  }

  function writeThemePref(value) {
    try {
      localStorage.setItem("irgen-theme", value);
    } catch (_) {
      // ignore
    }
  }

  function detectSystemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(value) {
    root.setAttribute("data-theme", value);
  }

  function setupThemeToggle() {
    const btn = document.querySelector("[data-irgen-theme-toggle]");
    if (!btn) return;
    const pref = readThemePref();
    const initial = pref || detectSystemTheme();
    applyTheme(initial);
    btn.setAttribute("aria-pressed", String(initial === "dark"));
    on(btn, "click", () => {
      const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      writeThemePref(next);
      btn.setAttribute("aria-pressed", String(next === "dark"));
    });
  }

  function setupTocScrollSpy() {
    const toc = document.querySelector("[data-irgen-toc]");
    if (!toc) return;
    const links = Array.from(document.querySelectorAll("[data-irgen-toc-link]"));
    if (!links.length) return;
    const targets = links.map((link) => {
      const id = link.getAttribute("data-irgen-toc-link");
      const el = id ? document.getElementById(id) : null;
      return { link, el, id };
    }).filter((t) => t.el);

    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
      let activeId = null;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId = entry.target.getAttribute("id");
          break;
        }
      }
      if (!activeId) return;
      targets.forEach((t) => {
        if (!t.id) return;
        t.link.classList.toggle("is-active", t.id === activeId);
      });
    }, { rootMargin: "0px 0px -70% 0px", threshold: [0, 1] });

    targets.forEach((t) => observer.observe(t.el));
    links.forEach((link) => {
      on(link, "click", (e) => {
        const href = link.getAttribute("href") || "";
        if (!href.startsWith("#")) return;
        const target = document.getElementById(href.slice(1));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    return Promise.resolve();
  }

  function setupCopyCode() {
    const buttons = document.querySelectorAll("[data-irgen-copy-code]");
    buttons.forEach((btn) => {
      on(btn, "click", async () => {
        const container = btn.closest(".irgen-code");
        const code = container ? container.querySelector("code") : null;
        const text = code ? code.textContent || "" : "";
        if (!text) return;
        const label = btn.querySelector(".irgen-button-label");
        const setLabel = (value) => {
          if (label) {
            label.textContent = value;
          } else {
            btn.textContent = value;
          }
        };
        try {
          await copyText(text);
          setLabel("Copied");
          setTimeout(() => { setLabel("Copy"); }, 1200);
        } catch (_) {
          setLabel("Failed");
          setTimeout(() => { setLabel("Copy"); }, 1200);
        }
      });
    });
  }

  function setupCopyAnchors() {
    const buttons = document.querySelectorAll("[data-irgen-copy-anchor]");
    buttons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const anchor = btn.getAttribute("data-irgen-copy-anchor");
        if (!anchor) return;
        try {
          const url = new URL(anchor, window.location.href).href;
          await copyText(url);
          btn.classList.add("is-copied");
          setTimeout(() => { btn.classList.remove("is-copied"); }, 1200);
        } catch (_) {
          // no-op
        }
      });
    });
  }

  async function setupSearch() {
    const root = document.querySelector("[data-irgen-search]");
    if (!root) return;
    const input = root.querySelector("[data-irgen-search-input]");
    const results = root.querySelector("[data-irgen-search-results]");
    if (!input || !results) return;
    const indexUrl = root.getAttribute("data-irgen-search-index") || "assets/search-index.json";
    let index = null;
    let mini = null;
    try {
      const resp = await fetch(indexUrl);
      if (!resp.ok) return;
      index = await resp.json();
    } catch (_) {
      return;
    }

    if (window.MiniSearch && index && Array.isArray(index.items)) {
      mini = new window.MiniSearch({
        fields: ["title", "description", "content"],
        storeFields: ["title", "description", "url"],
      });
      mini.addAll(index.items);
    }

    function render(items) {
      if (!items.length) {
        results.innerHTML = "";
        results.classList.remove("is-open");
        return;
      }
      const html = items.slice(0, 8).map((it) => {
        const title = (it.title || "").toString();
        const desc = (it.description || "").toString();
        return \`<a class="irgen-search-item" href="\${it.url}"><strong>\${title}</strong><span>\${desc}</span></a>\`;
      }).join("");
      results.innerHTML = html;
      results.classList.add("is-open");
    }

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!q || !index || !Array.isArray(index.items)) {
        render([]);
        return;
      }
      if (mini) {
        const matches = mini.search(q, { prefix: true, fuzzy: 0.2 });
        render(matches);
        return;
      }
      const matches = index.items.filter((it) => {
        const hay = \`\${it.title} \${it.description} \${it.content}\`.toLowerCase();
        return hay.includes(q);
      });
      render(matches);
    });
  }

  function setupMermaid() {
    if (!window.mermaid) return;
    const theme = root.getAttribute("data-theme") === "dark" ? "dark" : "default";
    window.mermaid.initialize({ startOnLoad: false, theme });
    const nodes = document.querySelectorAll(".mermaid");
    if (nodes.length) {
      window.mermaid.run({ nodes });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (CAP_SIDEBAR) setupSidebarToggle();
    if (CAP_COPY) {
      setupCopyCode();
      setupCopyAnchors();
    }
    if (CAP_THEME) setupThemeToggle();
    if (CAP_TOC) setupTocScrollSpy();
    if (CAP_SEARCH) setupSearch();
    if (CAP_MERMAID) setupMermaid();
  });
})();
`.trim();
}

export async function emitEnhancements(outDir: string, caps: EnhancementCaps): Promise<void> {
  const assetsDir = path.join(outDir, "assets");
  await fs.mkdir(assetsDir, { recursive: true });
  if (!caps.sidebarToggle && !caps.copyCode && !caps.themeToggle && !caps.tocScrollSpy && !caps.search && !caps.mermaid) return;
  const js = buildEnhancementsJs(caps);
  await fs.writeFile(path.join(assetsDir, "app.js"), `${js}\n`, "utf-8");
}
