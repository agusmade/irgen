# Frontend Policy — Current Implementation

This document summarizes **frontend policies that are actually implemented** in the code right now. Sections that are still planned/placeholder are marked.

## Source of truth
- Schema + defaults: `src/ir/target/frontend.policy.ts`
- Target normalization: `src/lowering/targets/to-frontend.ts` (transform `frontend-target`)
- PWA policy (domain): `src/lowering/frontend.ts`
- Emitter consumption: `src/emit/frontend/frontend-react.ts`

## Working today
- **Styling**
  - `styling.theme.primaryColor` is used for primary accents (CTA/button, icon tint, marketing sections).
  - `styling.theme.borderRadius` is used for marketing components (hero/features/cta/timeline/testimonials/faq).
  - Tailwind is used as the CSS framework (default).
- **Framework & Rendering**
  - Output is always React + Vite + React Router + Lucide.
  - `framework.rendering.mode`: `csr` (default), `ssg`, or `hybrid`.
  - `framework.rendering.basePath`: base URL for routing (e.g., `/admin`).
  - **Headless Runtime**: Generates `lib/runtime.ts` and `lib/hooks.ts` (`useOperation`, `useResource`) for backend communication.
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
  - Frontend policy: `frontend("App", { policies: { frontend: { styling: { theme: { primaryColor: "#0ea5e9", borderRadius: "lg" }}}}}, ...)`
  - PWA config: `frontend("App", { pwa: { enabled: true, name: "My App", shortName: "MyApp" } }, ...)`
- **Via CLI**
  - `--policies='{"frontend":{"styling":{"theme":{"primaryColor":"#0ea5e9","borderRadius":"lg"}},"pwa":{"enabled":true,"name":"My App","shortName":"MyApp"}}}'`

## Quick references
- Policy schema: `src/ir/target/frontend.policy.ts`
- Target lowering: `src/lowering/targets/to-frontend.ts`
- PWA lowering: `src/lowering/frontend.ts`
- Frontend emitter: `src/emit/frontend/frontend-react.ts`
