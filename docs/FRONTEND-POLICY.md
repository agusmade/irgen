# Frontend Policy — Current Implementation

This document summarizes **frontend policies that are actually implemented** in the code right now. Sections that are still planned/placeholder are marked.

## Source of truth
- Schema + defaults: `src/ir/target/frontend.policy.ts`
- Target normalization: `src/lowering/targets/to-frontend.ts` (transform `frontend-target`)
- PWA policy (domain): `src/lowering/frontend.ts`
- Emitter consumption: `src/emit/frontend/frontend-react.ts`

## Working today
- **Styling**
  - `styling.themePack` selects a layout/styling preset (`default`, `admin`).
  - `styling.theme.primaryColor` is used for primary accents (CTA/button, icon tint, marketing sections).
  - `styling.theme.borderRadius` is used for marketing components (hero/features/cta/timeline/testimonials/faq).
  - Tailwind is used as the CSS framework (default).
- **Error Boundary**
  - `errorBoundary.enabled=true` generates a React Error Boundary component and wraps the App.
  - Fallback UI can be configured as `simple` or `detailed`.
- **Component UI variants**
  - `component.props.uiVariant = "header" | "inline"` renders non-form content/button components without the default card wrapper.
  - `component.props.layoutVariant = "header"` renders `layout.kind = "row"` as a header row (title left, actions right) instead of a grid of cards.
- **Visual policy vocabulary**
  - A best-effort, non-validating space for UI knobs lives in `policies.frontend.visual` (or `policies.ui`).
  - See `docs/FRONTEND-VISUAL-CONTRACTS.md` for the shared vocabulary.
  - Emitter currently reads (best-effort): `visual.navLayout`, `visual.contentWidth`, `visual.density`.
  - Topbar controls: `visual.topbarControls` (items, enabled, avatar config, custom links).
  - Nav override: `visual.navItems` can separate topbar vs sidebar menus.
  - Footer links: `visual.footerLinks` (array of label/href) can replace or hide default links.
  - Footer layout: `visual.footer` (enabled/layout/text).
  - Forms: `visual.form` (label/input/error/form/button class overrides).
  - Buttons: `visual.button` (base + variant class overrides).
  - Tables: `visual.table` (container/head/row/cell/action class overrides).
  - Tabs: `visual.tabs` (container/header/tab/panel class overrides).
  - Marketing blocks: `visual.marketing` (per-block class overrides).
  - Cards: `visual.cards` (panel/empty/placeholder class overrides).
  - Prose: `visual.prose` (markdown wrapper class override).
  - Motion: `visual.motion` (page enter + hover/alert/tag motion classes).
  - Copy: `visual.copy` (empty/placeholder/table/tab strings + common labels).
  - Tokens: `visual.tokens` (typography/spacing/radius/shadow/color/motion tokens).
  - Icons: `visual.icons` (logo/search/notification/theme/pagination/tag/docs/nav/footer/search-modal/row-action icons, including docs item icons).
  - Breakpoints: `visual.breakpoints` (padding, sidebar width/visibility, topbar height/link/control wraps, docs grid, form/table responsive classes).
  - Agent chat block: `visual.agentChat` (container/body/message/input class overrides).
  - CLI usage block: `visual.cli` (command/output/badge/copy button class overrides).
  - Search UI: `visual.search` (enabled, placeholder, emptyMessage).
  - Docs chrome: `visual.docs` (labels + visibility for docs sidebar/TOC).
  - Background: `visual.background` (toggle decorative gradients).
  - Labels: `visual.labels` (sidebar label text, etc).
- **Framework & Rendering**
  - Output is always React + Vite + React Router + Lucide.
  - `framework.rendering.mode`: `csr` (default), `ssg`, or `hybrid`.
  - `framework.rendering.basePath`: base URL for routing (e.g., `/admin`).
  - **Headless Runtime**: Generates `lib/runtime.ts` and `lib/hooks.ts` (`useOperation`, `useResource`) for backend communication.
  - **Runtime request encoding**: Operations default to JSON bodies, and `formUrlEncoded` is supported when required by the backend (e.g., session login).
  - **Operation body types**: `json`, `text`, `multipart`, `formUrlEncoded`.
  - **Form prefill**: `form.load` can invoke an operation on mount and map the response into form fields. Route params are available in logic as `params.*`.
  - **Navbar links**: only static routes are included (paths containing `:` are omitted).
  - **Form submit label**: `form.submit.label` controls the submit button text (defaults to `Submit`).
  - **Auth-aware nav**: controlled by `frontend.auth` (login link hidden when authed, logout button shown).
  - **Auth redirect**: controlled by `frontend.auth` (redirect to login when unauthenticated).
  - **Table row navigation**: `table.rowNavigateTo` adds row click navigation (path template with `:slug` placeholders).
  - **Table row actions**: `table.rowActions` defines per-row buttons (invoke/navigate using `item.*` context).
  - **Action confirm**: `confirmMessage` can be set on any `ActionSpec` (invoke/navigate) and will show a confirmation dialog.
  - **Build postbuild hooks**: `build.copyTo` and `build.postbuild` allow emitting postbuild scripts in the frontend `package.json` (e.g., auto-copy build output into a backend public folder). (`copyToPublic` still works but is deprecated.)
- **PWA**
  - `pwa.enabled=true` writes `manifest.webmanifest`, `public/pwa-sw.js`, and `public/icons/icon.svg`, then registers the SW in the entry.
  - PWA values can be set via DSL (`frontend(..., { pwa: {...} })`) or via `policies.frontend.pwa`.

## Planned / not implemented yet
- **styling.cssFramework = "none"**: schema exists, but the emitter still always writes Tailwind config and Tailwind classes.
- **framework.library/router/iconLibrary = "none"**: schema exists, but the emitter still always uses React/React Router/Lucide.
- **Other theme tokens** (font, spacing, shadows) are not in policy yet; only `primaryColor` and `borderRadius`.

## Default FrontendPolicy (effective out-of-box)
```json
{
  "styling": {
    "cssFramework": "tailwind",
    "themePack": "default",
    "theme": {
      "primaryColor": "#4f46e5",
      "borderRadius": "md"
    }
  },
  "framework": {
    "library": "react",
    "runtime": "vite",
    "router": "react-router-dom",
    "iconLibrary": "lucide-react"
  },
  "build": {
    "copyTo": {
      "enabled": false,
      "targetRoot": "../php-shared-hosting/public",
      "fromDir": "dist"
    }
  }
}
```

## Default PWA (only when enabled)
```json
{
  "enabled": false,
  "name": "IR App",
  "shortName": "IRApp",
  "description": "Offline-ready web app",
  "startUrl": "/",
  "scope": "/",
  "display": "standalone",
  "backgroundColor": "#ffffff",
  "themeColor": "#0f172a"
}
```
If `pwa.enabled=true`, the values above become defaults and can be overridden by DSL/policies input.

## How to customize
- **Via DSL**
  - Frontend policy: `frontend("App", { policies: { frontend: { styling: { themePack: "admin", theme: { primaryColor: "#0ea5e9", borderRadius: "lg" }}}}}, ...)`
  - PWA config: `frontend("App", { pwa: { enabled: true, name: "My App", shortName: "MyApp" } }, ...)`
- **Via CLI**
  - `--policies='{"frontend":{"styling":{"theme":{"primaryColor":"#0ea5e9","borderRadius":"lg"}},"pwa":{"enabled":true,"name":"My App","shortName":"MyApp"}}}'`

## Quick references
- Policy schema: `src/ir/target/frontend.policy.ts`
- Target lowering: `src/lowering/targets/to-frontend.ts`
- PWA lowering: `src/lowering/frontend.ts`
- Frontend emitter: `src/emit/frontend/frontend-react.ts`
