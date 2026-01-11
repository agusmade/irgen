# STATIC-SITE (Enhanced) v1 — Checklist (irgen)

## Goals

* [x] Output is **final static HTML** (no React render/hydration).
* [x] JS is only for **progressive enhancement** (small UX), not for core layout/markup.
* [x] **Without JS the site remains readable** and navigable.
* [x] Dependencies are **opt-in by usage** (capability-based), especially for features like highlight/search.

## Non-goals (v1)

* [x] No full SPA routing / client-side navigation.
* [x] No SSR runtime.
* [x] No complex interactive components (form builder, async select, etc.) beyond simple fallbacks.

---

## Output Folder Contract

* [x] `dist/` (or `generated/.../static/`) contains:

  * [x] `index.html`
  * [x] `<slug>/index.html` (route folder style)
  * [x] `assets/style.css`
  * [x] `assets/app.js` (optional; only when enhancements are used)
  * [x] `assets/*.svg|png|woff2` (fonts/icons)
  * [x] `sitemap.xml` (optional v1, but recommended)
  * [x] `robots.txt` (optional v1)
* [x] Pretty URLs: `/docs/foo/` not `/docs/foo.html`.

---

## Target & Policy Shape

* [ ] Add a new target (free name, pick one):

  * [ ] `web:static`
  * [ ] `frontend:static`
  * [ ] `frontend:static-enhanced`
* [x] `staticSite` policy (example fields):

  * [x] `staticSite.enabled`
  * [x] `staticSite.baseUrl`
  * [x] `staticSite.trailingSlash`
  * [x] `staticSite.enhancements` (capability list)
  * [x] `staticSite.assets.hashing` (cache busting)
  * [x] `staticSite.codeHighlight.mode` = `pre` | `client` | `none`
  * [x] `staticSite.search.mode` = `none` | `client_index` | `remote`

---

## Capability Matrix (opt-in by usage)

> Principle: if a capability is not used in DSL/IR → **do not emit JS** and do not add deps.

### Minimal enhancements (v1)

* [x] `sidebarToggle` (hamburger / collapse)
* [x] `copyCode` (copy button on code blocks)
* [x] `themeToggle` (light/dark)
* [x] `tocScrollSpy`

### Additional features (can be delayed)

* [ ] `tabs`
* [ ] `accordion`
* [x] `search` (see Search section)

---

## Rendering Rules (HTML-first)

* [x] All pages render from TargetIR layout tree into final HTML:

  * [x] headings, paragraphs, lists, tables
  * [x] nav/sidebars/breadcrumbs
  * [x] code blocks: `<pre><code class="language-ts">...</code></pre>`
* [x] “Special” components may emit inline HTML (escape hatch) but:

  * [x] still deterministic
  * [x] does not require React runtime
* [x] Use `data-irgen-*` attributes for JS enhancement hooks (no fragile query selectors).

---

## CSS Strategy

* [x] Minimal, fast, predictable CSS output:

  * [x] base typography
  * [x] layout grid (header/sidebar/content)
  * [x] code block styling (no highlight tokens if mode=none)
* [x] Theme support:

  * [x] CSS variables (`--bg`, `--fg`, `--muted`, `--accent`)
  * [x] mode switch via `data-theme="dark"` on `<html>`
* [x] Allow override:

  * [x] `staticSite.customCssPath` or merge a `public/` folder.

---

## JS Strategy (Enhancement-only)

* [x] Emit `assets/app.js` only when enhancements are used.
* [x] app.js:

  * [x] event listeners based on `data-irgen-*`
  * [x] no DOM rebuild (no virtual DOM)
  * [x] does not replace the main HTML content
* [x] Degrade gracefully:

  * [x] all enhancement toggles have fallbacks (e.g., sidebar always visible if JS is off).

---

## Code Highlighting

Choose one mode (via policy + capability usage):

* [x] `pre` (recommended): highlight at build time (output HTML tokenized)

  * [x] highlight dependency only for toolchain/build (not client)
* [x] `client`: include runtime (e.g., Prism) only if `code` blocks exist

  * [x] lightweight load + defer
* [x] `none`: plain code block styling

---

## Search (optional v1)

* [x] `none` default
* [x] `client_index`:

  * [x] generate index JSON at build time
  * [x] runtime search lib only if search is enabled
* [ ] `remote`:

  * [ ] call external endpoint (future)

---

## SEO & Metadata

* [x] `<title>` per page (from page meta)
* [x] `<meta name="description">`
* [x] canonical URL (optional v1)
* [x] OpenGraph basic (optional v1)
* [x] `sitemap.xml` generation (recommended)
* [x] Heading structure check (single H1, etc.)

---

## Accessibility

* [x] Skip-to-content link
* [x] Landmark tags (`<header> <nav> <main> <footer>`)
* [x] Sidebar toggle button has `aria-expanded`, `aria-controls`
* [x] Minimum contrast met (light/dark)

---

## Performance & Caching

* [x] Asset hashing (CSS/JS) for cache busting
* [x] `defer` attribute for JS
* [x] `woff2` fonts + preload (optional)
* [x] no heavy runtime by default

---

## Security

* [x] Escape HTML for dynamic content (code, text)
* [x] CSP-friendly (no inline scripts; or inline only if policy allows)
* [x] External links use `rel="noopener noreferrer"`

---

## Testing & Verification (mandatory for “deterministic”)

* [x] Two minimal examples:

  * [x] `static-no-enhance` → **without** `assets/app.js` and enhancement deps
  * [x] `static-with-enhance` → **with** `assets/app.js` and minimal deps
* [x] Snapshot tests for:

  * [x] `dist/index.html`
  * [x] `dist/assets/*`
  * [x] ensure “JS off still readable” (check nav & content existence)
* [ ] Manual audit:

  * [ ] open HTML directly from file system (no server)
  * [ ] disable JS in browser → stays usable

---

## Exit Criteria v1

* [ ] Can generate irgen docs website as static-enhanced:

  * [ ] fast load
  * [ ] working sidebar navigation
  * [ ] legible code blocks + copy functionality
  * [ ] readable with JS off
