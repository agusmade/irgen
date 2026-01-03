# Frontend Policy — Implementasi Saat Ini

Dokumen ini merangkum **kebijakan frontend yang benar-benar diterapkan** di kode saat ini. Bagian yang masih rencana/placeholder ditandai.

## Sumber kebenaran
- Schema + default: `src/ir/target/frontend.policy.ts`
- Normalisasi target: `src/lowering/targets/to-frontend.ts` (transform `frontend-target`)
- PWA policy (domain): `src/lowering/frontend.ts`
- Konsumsi emitter: `src/emit/frontend/frontend-react.ts`

## Yang sudah berjalan hari ini
- **Styling**
  - `styling.theme.primaryColor` dipakai untuk aksen utama (CTA/button, icon tint, marketing sections).
  - `styling.theme.borderRadius` dipakai di komponen marketing untuk radius (hero/features/cta/timeline/testimonials/faq).
  - Tailwind dipakai sebagai CSS framework (default).
- **Framework**
  - Output selalu React + Vite + React Router + Lucide (package.json + config + imports).
- **PWA**
  - `pwa.enabled=true` akan menulis `manifest.webmanifest`, `public/pwa-sw.js`, dan `public/icons/icon.svg`, lalu register SW di entry.
  - Nilai PWA dapat diisi dari DSL (`frontend(..., { pwa: {...} })`) atau dari `policies.frontend.pwa`.

## Masih rencana / belum diimplementasikan
- **styling.cssFramework = "none"**: schema ada, tetapi emitter masih selalu menulis Tailwind config dan class Tailwind.
- **framework.library/runtime/router/iconLibrary = "none"**: schema ada, tetapi emitter masih selalu memakai React/Vite/React Router/Lucide.
- **Theme tokens lain** (font, spacing, shadows) belum ada di policy; hanya `primaryColor` dan `borderRadius`.

## Default FrontendPolicy (efektif out-of-box)
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

## Default PWA (hanya jika enabled)
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
Jika `pwa.enabled=true`, maka nilai di atas menjadi default dan bisa dioverride oleh input DSL/policies.

## Cara mengubah sesuai kebutuhan
- **Via DSL**
  - Frontend policy: `frontend("App", { policies: { frontend: { styling: { theme: { primaryColor: "#0ea5e9", borderRadius: "lg" }}}}}, ...)`
  - PWA config: `frontend("App", { pwa: { enabled: true, name: "My App", shortName: "MyApp" } }, ...)`
- **Via CLI**
  - `--policies='{"frontend":{"styling":{"theme":{"primaryColor":"#0ea5e9","borderRadius":"lg"}},"pwa":{"enabled":true,"name":"My App","shortName":"MyApp"}}}'`

## Referensi cepat
- Policy schema: `src/ir/target/frontend.policy.ts`
- Target lowering: `src/lowering/targets/to-frontend.ts`
- PWA lowering: `src/lowering/frontend.ts`
- Frontend emitter: `src/emit/frontend/frontend-react.ts`

