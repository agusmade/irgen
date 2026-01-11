# Frontend SSG (React) — Design Plan

This document designs the **React SSG** pipeline for the frontend target based on Vite. The main focus is prerendering through the Vite pipeline (not manual `renderToString`), final HTML for `mode="ssg"`, and hybrid mode for `mode="hybrid"`.

Status: **implemented** (SSR bundle + prerender step, HTML output at the root `outDir`).

## Goals

- Prerendered HTML as the primary output (SEO-friendly).
- `mode="ssg"`: **no hydration** (final HTML).
- `mode="hybrid"`: **optional** hydration only for pages/components that need interactivity.
- Asset injection uses the Vite manifest (controlled CSS/JS).

## Non-Goals

- Full SSR runtime.
- Custom React renderer/manual `renderToString` as the primary path.

## Policy Surface (Frontend)

Source: `src/ir/target/frontend.policy.ts`

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

Notes:
- `mode="ssg"` implies `prerender.enabled=true`.
- `routes="auto"` uses `FrontendIR.pages`.

## Pipeline (High-Level)

1) **Vite Build**
   - Generate bundle + manifest (`dist/manifest.json`).
   - Output JS/CSS to `prerender.outDir` (default `dist`).

2) **Prerender Step**
   - Run the Vite SSG pipeline (build + SSR bundle + prerender script).
   - Render HTML per route (routes = auto from `FrontendIR.pages` or a manual list).
   - Inject CSS/JS from the manifest.

3) **Post-Process**
   - SSG mode: **do not** include hydrate script.
   - Hybrid mode: include hydrate script for pages flagged as interactive.
   - Optional: `sitemap.xml` and `robots.txt` when policy allows.

## Manifest Injection (SSG)

- Use `manifest.json` for mapping:
  - `entry` → JS
  - `css` → `<link rel="stylesheet">`
- For SSG: HTML contains CSS + (optional) JS runtime if mode is `hybrid`.

## Hydration Strategy

- `mode="ssg"`: no hydration.
- `mode="hybrid"`: hydrate only if:
  - the page contains interactive components (form, tabs, async, etc.), or
  - a manual policy/flag is set in the DSL (`frontend.meta` / future policy flag).

Notes: the interactive flag can be produced during lowering (capability tagging).
Current implementation note: the app shell has a theme toggle, so all routes are considered interactive in `mode="hybrid"`.

## Output Structure

```
<outDir>/
  dist/              # Vite build output (JS/CSS/assets)
  index.html         # prerendered (root) for SSG
  index.spa.html     # SPA fallback (CSR entry)
  docs/foo/index.html
  sitemap.xml        # optional
  robots.txt         # optional
```

`prerender.outDir` can be set to separate build assets from HTML output.

## Integration Points

- `src/emit/frontend/frontend-react.ts`: needs a CSR vs SSG mode switch.
- `src/emit/frontend/`: add a runner for Vite SSG (plugin or CLI).
- `src/emit/registry.ts`: keep mapping `frontend -> frontend-tsmorph` (same emitter, behavior branch).

## Open Questions

Resolved:
- SSG replaces `index.html` for static output, and SPA fallback is saved as `index.spa.html`.
- Prerendered HTML is placed at the root `outDir` (folder-style routing).
- Interactivity is tagged during lowering (capability tagging) with policy as the guard.
