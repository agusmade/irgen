# STATIC-SITE (Enhanced) v1 — Checklist (irgen)

## Tujuan

* [x] Output berupa **HTML statis final** (tanpa React render/hydration).
* [x] JS hanya untuk **progressive enhancement** (UX kecil), bukan menentukan layout/markup utama.
* [x] **Tanpa JS pun situs tetap terbaca** dan navigable.
* [x] Dependency **opt-in by usage** (capability-based), terutama untuk fitur seperti highlight/search.

## Non-tujuan (v1)

* [x] Tidak mengejar SPA routing / client-side navigation penuh.
* [x] Tidak mengejar SSR runtime.
* [x] Tidak mengejar komponen interaktif kompleks (form builder, async select, dsb) selain fallback sederhana.

---

## Kontrak Output Folder

* [x] `dist/` (atau `generated/.../static/`) berisi:

  * [x] `index.html`
  * [x] `docs/<slug>/index.html` (route folder style)
  * [x] `assets/style.css`
  * [x] `assets/app.js` (opsional; hanya jika ada enhancement)
  * [x] `assets/*.svg|png|woff2` (fonts/icons)
  * [x] `sitemap.xml` (opsional v1, tapi bagus)
  * [x] `robots.txt` (opsional v1)
* [x] URL yang “cantik”: `/docs/foo/` bukan `/docs/foo.html`.

---

## Target & Policy Shape

* [ ] Tambah target baru (nama bebas, pilih salah satu):

  * [ ] `web:static`
  * [ ] `frontend:static`
  * [ ] `frontend:static-enhanced`
* [x] Policy `staticSite` (contoh bidang):

  * [x] `staticSite.enabled`
  * [x] `staticSite.baseUrl`
  * [x] `staticSite.trailingSlash`
  * [x] `staticSite.enhancements` (list capability)
  * [x] `staticSite.assets.hashing` (cache busting)
  * [x] `staticSite.codeHighlight.mode` = `pre` | `client` | `none`
  * [x] `staticSite.search.mode` = `none` | `client_index` | `remote`

---

## Capability Matrix (opt-in by usage)

> Prinsip: kalau capability tidak dipakai di DSL/IR → **tidak emit JS**, tidak tambah deps.

### Enhancement minimal (v1)

* [x] `sidebarToggle` (hamburger / collapse)
* [x] `copyCode` (tombol copy pada code block)
* [x] `themeToggle` (light/dark) **opsional**
* [x] `tocScrollSpy` **opsional**

### Fitur tambahan (boleh ditunda)

* [ ] `tabs`
* [ ] `accordion`
* [x] `search` (lihat bagian Search)

---

## Rendering Rules (HTML-first)

* [x] Semua halaman di-render dari TargetIR layout tree menjadi HTML final:

  * [x] headings, paragraphs, lists, tables
  * [x] nav/sidebars/breadcrumbs
  * [x] code blocks: `<pre><code class="language-ts">...</code></pre>`
* [x] Komponen “khusus” boleh emit HTML inline (escape hatch) tapi:

  * [x] tetap deterministic
  * [x] tidak memerlukan runtime React
* [x] Gunakan `data-irgen-*` attributes untuk hook JS enhancement (tanpa query selector rapuh).

---

## CSS Strategy

* [x] Output CSS minimal, cepat, dan predictable:

  * [x] base typography
  * [x] layout grid (header/sidebar/content)
  * [x] code block styling (tanpa highlight token jika mode=none)
* [x] Theme support:

  * [x] CSS variables (`--bg`, `--fg`, `--muted`, `--accent`)
  * [x] mode switch via `data-theme="dark"` pada `<html>`
* [x] Allow override:

  * [x] `staticSite.customCssPath` atau folder `public/` merge.

---

## JS Strategy (Enhancement-only)

* [x] Emit `assets/app.js` hanya jika ada enhancement capability.
* [x] app.js:

  * [x] event listeners berbasis `data-irgen-*`
  * [x] tidak membangun DOM ulang (no virtual DOM)
  * [x] tidak “mengganti” HTML konten utama
* [x] Degrade gracefully:

  * [x] semua tombol enhancement punya fallback (mis. sidebar selalu tampil jika JS off).

---

## Code Highlighting

Pilih salah satu mode (via policy + capability usage):

* [x] `pre` (recommended): highlight saat build (output HTML tokenized)

  * [x] dependency highlight hanya untuk toolchain/build (bukan client)
* [x] `client`: include runtime (mis. Prism) hanya jika ada `code` block

  * [x] load ringan + defer
* [x] `none`: plain code block styling

---

## Search (opsional v1)

* [x] `none` default
* [x] `client_index`:

  * [x] generate index JSON saat build
  * [x] runtime search lib hanya jika search diaktifkan
* [ ] `remote`:

  * [ ] panggil endpoint eksternal (bisa nanti)

---

## SEO & Metadata

* [x] `<title>` per halaman (dari page meta)
* [x] `<meta name="description">`
* [x] canonical URL (opsional v1)
* [x] OpenGraph basic (opsional v1)
* [x] `sitemap.xml` generation (recommended)
* [x] Heading structure valid (H1 satu kali, dst)

---

## Aksesibilitas

* [x] Skip-to-content link
* [x] Landmark tags (`<header> <nav> <main> <footer>`)
* [x] Sidebar toggle button punya `aria-expanded`, `aria-controls`
* [x] Contrast minimum terpenuhi (light/dark)

---

## Performance & Caching

* [x] Asset hashing (CSS/JS) untuk cache busting
* [x] `defer` untuk JS
* [x] fonts `woff2` + preload (opsional)
* [x] no heavy runtime by default

---

## Security

* [x] Escape HTML untuk konten dinamis (code, text)
* [x] CSP-friendly (no inline script; atau inline hanya jika policy mengizinkan)
* [x] Link eksternal pakai `rel="noopener noreferrer"`

---

## Testing & Verification (wajib untuk “deterministic”)

* [x] Dua example minimal:

  * [x] `static-no-enhance` → **tanpa** `assets/app.js` dan tanpa deps enhancement
  * [x] `static-with-enhance` → **dengan** `assets/app.js` dan deps minimal
* [x] Snapshot test untuk:

  * [x] `dist/index.html`
  * [x] `dist/assets/*`
  * [x] memastikan “JS off still readable” (cek elemen nav & konten ada)
* [ ] Audit manual:

  * [ ] buka HTML langsung dari file system (tanpa server)
  * [ ] matikan JS di browser → tetap usable

---

## Exit Criteria v1

* [ ] Bisa generate docs website irgen sebagai static-enhanced:

  * [ ] load cepat
  * [ ] navigasi sidebar jalan
  * [ ] code block enak dibaca + copy
  * [ ] JS off tetap terbaca
