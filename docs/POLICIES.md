# Policies Reference

Dokumen ini merangkum semua policy yang saat ini dipakai di irgen untuk backend dan frontend (termasuk static-site). Gunakan ini sebagai peta percabangan saat menambah fitur baru.

## Entry Point: `app(...)` vs `frontend(...)`

irgen memiliki dua entry point DSL yang berbeda karena DomainIR‑nya berbeda:

- `app(...)` → menghasilkan **backend DomainIR** (entities, services, operations).
- `frontend(...)` → menghasilkan **frontend DomainIR** (pages, components, marketing blocks).

Implikasinya:

- **Target backend** hanya bisa berangkat dari `app(...)`.
- **Target frontend / electron / static-site** berangkat dari `frontend(...)` (static-site memakai FrontendIR).
- Saat CLI menjalankan `--targets=backend,frontend`, irgen akan **mengagregasi** dua DSL (app + frontend) bila keduanya ada.

Alasan tidak semua berangkat dari `app(...)`:

- Struktur data yang dibutuhkan backend vs frontend sangat berbeda.
- Frontend punya konsep page/layout/component yang tidak ada di backend.
- Memisahkan entry point menjaga IR tetap deterministik dan tidak memaksa satu DSL menampung dua domain yang berbeda.

Ringkasnya: **`app(...)` untuk backend**, **`frontend(...)` untuk UI/HTML/Electron/static‑site**.  

## Cara pakai (DSL)

Di DSL, policy ditaruh di `policies` dan dipilih berdasarkan target. Contoh:

```ts
frontend("MyApp", {
  policies: {
    backend: { core: { generateId: "uuid_v4" } },
    frontend: { styling: { theme: { primaryColor: "#4f46e5" } } },
    staticSite: { baseUrl: "/", assets: { hashing: true } },
    electron: { window: { width: 1200, height: 800 } },
  },
}, (app) => { /* ... */ });
```

Catatan: `static-site` bisa ditulis sebagai `staticSite` di DSL (keduanya dikenali).

## Backend Policies (`backend`)

Sumber: `src/ir/target/backend.policy.ts`

- `backend.interfaces.rest`
  - `enabled` (boolean)
  - `basePath` (string, default `/api`)
  - `openapi`
    - `enabled` (boolean)
    - `title` (string)
    - `version` (string)
    - `serverUrl` (string?)
  - `publicRoutes` (string[])
- `backend.envelope`
  - `type` = `standard_v1`
  - `keys` (`data`, `meta`, `error`)
  - `meta.requestIdKey`
  - `errorShape` (`codeKey`, `messageKey`, `detailsKey`)
- `backend.pagination`
  - `type` = `page_limit`
  - `defaults` (`page`, `limit`, `maxLimit`)
  - `meta` (`pageKey`, `limitKey`, `totalKey`, `hasNextKey`)
- `backend.auth.jwt`
  - `enabled` (boolean)
  - `algorithm` = `HS256` | `RS256`
  - `secret` (string, HS256 only)
  - `jwksUrl` (string, RS256 only)
  - `issuer`, `audience` (string?)
  - `clockToleranceSec` (number)
  - `claims` (`subjectKey`, `rolesKey`)
- `backend.core`
  - `generateId` = `uuid_v4` | `shortid` | `custom`
  - `loggerImpl` = `console` | `pino` | `winston` | `custom`
  - `httpClient` = `fetch` | `axios` | `got` | `custom`
  - `formatter` = `prettier` | `biome`
  - `db` (`provider` = `prisma`, `url`)

## Frontend Policies (`frontend`)

Sumber: `src/ir/target/frontend.policy.ts`

- `frontend.styling`
  - `cssFramework` = `tailwind` | `none`
  - `theme`
    - `primaryColor` (string)
    - `borderRadius` = `none` | `sm` | `md` | `lg` | `full`
- `frontend.framework`
  - `library` = `react`
  - `runtime` = `vite` | `none`
  - `router` = `react-router-dom` | `none`
  - `iconLibrary` = `lucide-react` | `none`
  - `rendering`
    - `mode` = `csr` | `ssg` | `hybrid`
    - `prerender`
      - `enabled` (boolean)
      - `routes` = `auto` | string[]
      - `outDir` (string)
      - `emitSitemap` (boolean)
      - `emitRobotsTxt` (boolean)

Notes:
- Untuk `mode="ssg"`, HTML prerender ditulis ke root `outDir` (folder-style routing).
- `index.html` tetap SPA fallback (CSR entry), dan SSG akan menyalinnya ke `index.spa.html` sebelum overwrite.
- `SITE_URL` (env var) dipakai untuk `sitemap.xml`/`robots.txt` jika diaktifkan.

## Static Site Policies (`static-site` / `staticSite`)

Sumber: `src/ir/target/static-site.policy.ts`

- `staticSite.enabled` (boolean)
- `staticSite.baseUrl` (string)
- `staticSite.trailingSlash` (boolean)
- `staticSite.outDir` (string, default `.`)
- `staticSite.customCssPath` (string?)
- `staticSite.assets`
  - `hashing` (boolean)
  - `publicDir` (string?)
- `staticSite.enhancements`
  - `enabled` (boolean)
  - `features` = `sidebarToggle` | `copyCode` | `themeToggle` | `tocScrollSpy` | `tabs` | `accordion` | `search` | `mermaid`
- `staticSite.codeHighlight`
  - `mode` = `pre` | `client` | `none`
  - `theme` (string?)
  - `addCopyButton` (boolean)
- `staticSite.search`
  - `mode` = `none` | `client_index` | `remote`
  - `indexFile` (string)
- `staticSite.seo`
  - `defaultTitle` (string)
  - `titleTemplate` (string)
  - `defaultDescription` (string)
  - `canonicalBaseUrl` (string | null)
  - `sitemap.enabled` (boolean)
  - `robotsTxt.enabled` (boolean)
  - `openGraph.enabled` (boolean)
- `staticSite.theme`
  - `mode` = `light` | `dark` | `auto`
  - `accentColor` (string)
  - `radius` = `sm` | `md` | `lg`
- `staticSite.security`
  - `csp.enabled` (boolean)
  - `csp.value` (string?)
  - `externalLinks.noopener` (boolean)
  - `externalLinks.noreferrer` (boolean)
- `staticSite.navbar`
  - `links` = array of `{ label: string, href: string }`
- `staticSite.sidebar`
  - `groups` = array of `{ label: string, items: string[] }`
    - `items` accepts route paths (e.g. `"/policies/"`) or page ids (e.g. `"policies"`).

## Electron Policies (`electron`)

Sumber: `src/ir/target/electron.policy.ts`

- `electron.window`
  - `width`, `height` (number?)
  - `resizable` (boolean?)
  - `fullscreen` (boolean?)
  - `devTools` (boolean?)
- `electron.security`
  - `contextIsolation` (boolean?)
  - `sandbox` (boolean?)
  - `ipcWhitelist` (string[]?)
  - `csp` (string?)
- `electron.packaging`
  - `tool` = `electron-builder`
  - `appId`, `productName`, `artifactName`, `outputDir`, `buildResources`, `icon` (string?)
  - `asar` (boolean?)
  - `extraFiles` (string[]?)
  - `extraResources` (string[] | { from, to? }[])
  - `mac`, `win`, `linux` (record?)
- `electron.autoUpdate`
  - `enabled` (boolean?)
  - `provider` = `generic` | `github` | `spaces` | `s3`
  - `url`, `channel` (string?)
  - `publish` (record?)
  - `allowPrerelease` (boolean?)
  - `requestHeaders` (record<string, string>?)
  - `retryOnFail` (boolean?)
  - `retryDelayMs` (number?)
- `electron.reliability`
  - `singleInstance` (boolean?)
  - `logging` (`enabled`, `level`, `fileMaxSizeMB`, `console`)
  - `performance.disableBackgroundThrottling` (boolean?)
  - `crashReporting` (`enabled`, `provider`, `submitURL`, `dsn`, `productName`, `companyName`, `environment`)
  - `session` (`restoreWindowBounds`, `windowStateFile`, `saveOnClose`)
- `electron.ipc`
  - `whitelist` (string[]?)
  - `handlers` ({ channel, description? }[])
- `electron.loading`
  - `devUrl` (string?)
  - `prodIndex` (string?)
  - `splashHtml` (string?)

## CLI Target (`cli`)

Sumber: `src/ir/target/cli.ts`

- Tidak ada policy khusus untuk target CLI saat ini (hanya domain IR).
- Schema policy CLI adalah objek kosong `passthrough` (tidak divalidasi secara ketat).

## Prinsip implementasi (ringkas)

- Kebijakan diputuskan di lowering (TargetIR), emitter membaca hasilnya.
- Static-site hanya emit JS jika capability benar-benar dipakai.
- HTML-first: tanpa JS tetap terbaca.
