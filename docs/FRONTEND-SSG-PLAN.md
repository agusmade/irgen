# Frontend SSG (React) — Design Plan

Dokumen ini merancang pipeline **React SSG** untuk target frontend dengan basis Vite. Fokus utama: prerender via Vite pipeline (bukan renderToString manual), HTML final untuk `mode="ssg"`, dan hybrid untuk `mode="hybrid"`.

Status: **implemented** (SSR bundle + prerender step, output HTML di root `outDir`).

## Goals

- HTML hasil prerender sebagai output utama (SEO-friendly).
- `mode="ssg"`: **no hydrate** (HTML final).
- `mode="hybrid"`: hydrate **opsional** hanya untuk halaman/komponen yang membutuhkan interaktivitas.
- Asset injection memakai Vite manifest (CSS/JS terkontrol).

## Non-Goals

- SSR runtime penuh.
- Custom React renderer/manual `renderToString` sebagai jalur utama.

## Policy Surface (Frontend)

Sumber: `src/ir/target/frontend.policy.ts`

```
frontend.framework.rendering.mode = "csr" | "ssg" | "hybrid"
frontend.framework.rendering.prerender = {
  enabled: boolean,
  routes: "auto" | string[],
  outDir: string,
  emitSitemap: boolean,
  emitRobotsTxt: boolean
}
```

Catatan:
- `mode="ssg"` implies `prerender.enabled=true`.
- `routes="auto"` menggunakan `FrontendIR.pages`.

## Pipeline (High-Level)

1) **Vite Build**
   - Generate bundle + manifest (`dist/manifest.json`).
   - Output JS/CSS ke `prerender.outDir` (default `dist`).

2) **Prerender Step**
   - Jalankan Vite SSG pipeline (build + SSR bundle + prerender script).
   - Render HTML per route (routes = auto dari `FrontendIR.pages` atau list manual).
   - Inject CSS/JS dari manifest.

3) **Post-Process**
   - SSG mode: **tidak** include hydrate script.
   - Hybrid mode: include hydrate script untuk halaman yang flagged interaktif.
   - Optional: `sitemap.xml` dan `robots.txt` bila policy mengizinkan.

## Manifest Injection (SSG)

- Gunakan `manifest.json` untuk mapping:
  - `entry` → JS
  - `css` → `<link rel="stylesheet">`
- Untuk SSG: HTML berisi CSS + (opsional) JS runtime jika mode `hybrid`.

## Hydration Strategy

- `mode="ssg"`: no hydrate.
- `mode="hybrid"`: hydrate only if:
  - halaman mengandung komponen interactive (form, tabs, async, dll), atau
  - policy/flag manual di DSL (`frontend.meta` / future policy flag).

Catatan: flag interaktif bisa dihasilkan pada lowering (capability tagging).
Catatan implementasi saat ini: App shell memiliki theme toggle, jadi semua route dianggap interaktif pada `mode="hybrid"`.

## Output Structure

```
<outDir>/
  dist/              # Vite build output (JS/CSS/assets)
  index.html         # prerendered (root) untuk SSG
  index.spa.html     # SPA fallback (CSR entry)
  docs/foo/index.html
  sitemap.xml        # optional
  robots.txt         # optional
```

`prerender.outDir` bisa diset untuk memisahkan build assets vs HTML output.

## Integration Points

- `src/emit/frontend/frontend-react.ts`: perlu mode switch CSR vs SSG.
- `src/emit/frontend/`: tambah runner untuk Vite SSG (plugin or CLI).
- `src/emit/registry.ts`: tetap mapping `frontend -> frontend-tsmorph` (emitter same, behavior branch).

## Open Questions

Resolved:
- SSG menggantikan `index.html` untuk output statis, dan SPA fallback disimpan sebagai `index.spa.html`.
- HTML hasil prerender berada di root `outDir` (folder-style routing).
- Interactivity ditandai dari lowering (capability tagging) dengan policy sebagai guard.
