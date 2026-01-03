# Backend Policy — Implementasi Saat Ini

Dokumen ini merangkum **kebijakan backend yang benar-benar diterapkan** di kode (per `src/ir/target/backend.policy.ts`, lowering `to-backend.ts`, dan emitter backend). Bagian yang masih rencana/placeholder ditandai.

## Sumber kebenaran
- Schema + default: `src/ir/target/backend.policy.ts`
- Normalisasi & merge legacy flags: `src/lowering/targets/to-backend.ts` (terdaftar sebagai transform `backend-target`)
- Konsumsi emitter: `src/emit/backend/backend-tsmorph.ts` (helper `getBackendPolicies`)

## Yang sudah berjalan hari ini
- **Interfaces**
  - REST saja (`interfaces.rest.enabled`), `basePath` default `/api`
  - OpenAPI flag/title/version/serverUrl diteruskan ke `emitOpenAPI`
  - `publicRoutes` dipakai auth middleware untuk bypass per prefix
- **Envelope**
  - Tipe `standard_v1` dengan key `data/meta/error`; dipakai di `lib/response.ts` + controller responses
  - `requestIdKey` disuntik via `withRequestId` (middleware context)
- **Pagination**
  - Skema `page_limit` default `page=1`, `limit=20`, `maxLimit=100`; meta key `page/limit/total/hasNext`
- **Auth**
  - JWT (HS256/RS256 di schema); runtime `lib/auth.ts` **selalu pakai shared secret** (`jsonwebtoken.verify` dengan `JWT_SECRET`) ⇒ RS256/JWKS belum jalan (lihat “Masih rencana”)
  - `claims.subjectKey` & `claims.rolesKey` dipakai untuk `req.user`; helper `requireRoles` tersedia
- **Core knobs**
  - `generateId`: `uuid_v4` (uuid), `shortid` (crypto), `custom` melempar error (belum ada hook)
  - `loggerImpl`: `console` real console; `pino`/`winston` hanya wrapper console (butuh deps dan wiring jika mau nyata)
  - `httpClient`: `fetch` (default); `axios` adapter ada; `got/custom` belum diimplementasi
  - `formatter`: `prettier` atau `biome`; emitter memanggil `formatDirectory` (package.json hanya menambahkan Prettier)
  - `db`: opsional `provider: "prisma", url`; jika prisma dipilih, schema+repo+deps Prisma dan script `db:generate/db:push` ditulis
- **Packaging**
  - `package.json` menambah deps berdasarkan `generateId` (uuid), `httpClient` (axios/got), `loggerImpl` (pino/winston), `db` (prisma). Dev deps: prettier, typescript, tsx, vitest, @types, express tooling, jsonwebtoken, cors.
  - `tsconfig.json` CJS target, strict off
- **Server runtime**
  - Express server dengan CORS/JSON, request context (requestId + scoped logger), auth (conditional), validation (zod), pagination helper, envelope response
  - CRUD routes per entity (CREATE/GET/LIST/UPDATE/REMOVE) dengan zod schema sederhana berdasar tipe primitif model

## Masih rencana / belum diimplementasikan
- **JWT RS256/JWKS**: schema menerima `algorithm: "RS256"` + `jwksUrl`, tapi `lib/auth.ts` belum verifikasi JWKS; runtime pakai shared secret.
- **httpClient "got"/"custom"**: adapter `lib/http.ts` belum ada implementasi.
- **loggerImpl "pino"/"winston"**: adapter hanya wrapper console; tidak menginstansiasi logger sebenarnya.
- **generateId "custom"**: adapter melempar error; belum ada hook injeksi implementasi.
- **Transports non-REST**: hanya REST; tidak ada RPC/WS/GraphQL.
- **Envelope/pagination varian lain**: hanya `standard_v1` dan `page_limit`.
- **DB provider selain Prisma**: hanya Prisma (atau in-memory repo).
- **Formatter "biome"**: schema menerima, tapi package.json tidak menambah Biome; formatDirectory tetap dipanggil dengan nilai tersebut.

## Default BackendPolicy (efektif out-of-box)
```json
{
  "interfaces": {
    "rest": {
      "enabled": true,
      "basePath": "/api",
      "openapi": {
        "enabled": true,
        "title": "API",
        "version": "1.0.0"
      },
      "publicRoutes": []
    }
  },
  "envelope": {
    "type": "standard_v1",
    "keys": { "data": "data", "meta": "meta", "error": "error" },
    "meta": { "requestIdKey": "requestId" },
    "errorShape": { "codeKey": "code", "messageKey": "message", "detailsKey": "details" }
  },
  "pagination": {
    "type": "page_limit",
    "defaults": { "page": 1, "limit": 20, "maxLimit": 100 },
    "meta": { "pageKey": "page", "limitKey": "limit", "totalKey": "total", "hasNextKey": "hasNext" }
  },
  "auth": {
    "jwt": {
      "enabled": true,
      "algorithm": "HS256",
      "secret": "CHANGE_ME_SUPER_SECRET_MIN_16_CHARS",
      "issuer": null,
      "audience": null,
      "clockToleranceSec": 30,
      "claims": { "subjectKey": "sub", "rolesKey": "roles" }
    }
  },
  "core": {
    "generateId": "uuid_v4",
    "loggerImpl": "console",
    "httpClient": "fetch",
    "formatter": "prettier"
  }
}
```

## Cara mengubah sesuai kebutuhan
- **Kebijakan via DSL**: `app("...", { policies: { backend: { ... } } }, ...)`
- **Override via CLI**: `--policies='{"backend":{"loggerImpl":"pino","generateId":"shortid","db":{"provider":"prisma","url":"file:./dev.db"}}}'`
- **Public routes**: tambahkan `interfaces.rest.publicRoutes` (mis. `["/auth/login","/health"]`) untuk bypass auth.
- **OpenAPI**: matikan dengan `interfaces.rest.openapi.enabled=false` atau isi `serverUrl` untuk prod.
- **JWT RS256 (rencana)**: schema sudah ada; runtime JWKS perlu ditambah dulu sebelum dipakai.
- **DB**: set `core.db` ke `{"provider":"prisma","url":"file:./dev.db"}` untuk menulis schema + repos berbasis Prisma.
- **Formatter**: pilih `prettier`/`biome`; hanya Prettier yang otomatis ditambahkan sebagai dev dependency.
- **Custom ID/logger/http**: saat ini akan melempar error atau wrapper console; butuh extend adapter jika mau kustom.

## Referensi cepat
- Schema: `src/ir/target/backend.policy.ts`
- Lowering & legacy merge: `src/lowering/targets/to-backend.ts`
- Emitters/adapters: `src/emit/backend/backend-tsmorph.ts`, `src/emit/backend/adapters.ts`, `src/emit/backend/server.ts`, `src/emit/backend/packaging.ts`

