# Frontend Core Spec v0.9 — General-Purpose Webapp Generator (Status: Implemented ✅)

## 0) Tujuan dan Non-Tujuan

### Tujuan

1. Frontend irgen dapat membangun **banyak app**: admin panel, dashboard, publik+internal, tooling, dsb.
2. Frontend dapat terhubung ke **backend apa pun** (PHP shared hosting, Node, Go, third-party SaaS) dengan:

   * JSON REST
   * multipart upload
   * text/html
   * file download (blob)
   * event stream (SSE) *opsional*
3. Frontend mendukung pola non-CRUD:

   * publish/unpublish
   * preview
   * rebuild
   * import/export
   * command endpoints
4. Integrasi tidak mengubah core generator: cukup lewat **DSL/policies** dan/atau **extension hooks**.
5. Output tetap “production-ready”: routing, auth guard, error UX, caching ringan, retry, dsb.

### Non-Tujuan (v0.9)

* WebSocket runtime server (frontend hanya client)
* Offline-first sinkronisasi kompleks
* Visual editor WYSIWYG bawaan (boleh plugin)

---

## 1) Artefak yang dihasilkan (output)

Frontend core menghasilkan:

* **Vite + React** app (atau kompatibel framework lain via target di masa depan)
* folder `src/` dengan:

  * router
  * pages
  * data client runtime
  * auth runtime
  * generated UI components (forms, tables, pages)
  * optional “widgets”
* satu entry runtime config (optional):

  * `public/app-config.json` atau `window.__APP_CONFIG__` injection

> Kunci: generated frontend harus bisa berjalan **independen** dari backend generator mana pun.

---

## 2) Model Konseptual (yang harus ada di Frontend IR)

Frontend core perlu memformalkan 6 konsep utama:

1. **App**
2. **Routes / Pages**
3. **DataSources** (cara konek ke dunia luar)
4. **Resources** (CRUD-ish tapi fleksibel)
5. **Actions** (command endpoints)
6. **Auth Strategies + Guards**
7. **Data Queries & Mutations** (caching, invalidation)
8. **UI Bindings** (form/table mapping + response handling)

Semua ini harus ada dalam **Frontend DomainIR** (semantik) lalu diturunkan menjadi **Frontend TargetIR** (emitter-friendly).

---

## 3) DSL / Declaration Layer (Authoring)

Anda bebas mengekspresikan DSL seperti sekarang, tetapi minimal harus bisa menulis:

### 3.1 App Meta

* `appName`, `basePath` (mis. `/app`, `/admin`)
* `runtimeConfig` (optional)
* `theme` (optional)

### 3.2 DataSource Definitions

Satu frontend bisa punya banyak datasource:

* `publisherApi` (PHP `/admin-api`)
* `internalApi` (PHP `/api`)
* `payments` (3rd-party)
* dsb.

### 3.3 Resource Definitions

* list/get/create/update/delete mapping
* pagination contract
* search/filter/sort mapping
* field mapping (server ↔ UI)

### 3.4 Action Definitions

* publish, preview, upload, export, etc.

### 3.5 Pages / Views

* `TablePage` (list)
* `FormPage` (edit/create)
* `DetailPage`
* `CustomPage` (blocks)
* plus built-in widgets (tabs/panels/content)

> Semua definisi di atas harus murni “konfiguratif”: tidak hard-coded ke backend tertentu.

---

## 4) DataSource Spec (paling penting)

### 4.1 Struktur DataSource

Setiap datasource mendefinisikan:

* `id`: string unik
* `baseUrl`: string (default relatif)
* `defaultHeaders`: map
* `auth`: `AuthStrategyRef`
* `csrf`: CSRF strategy (optional)
* `retryPolicy` (optional)
* `timeoutMs` (optional)
* `responseDefaults` (optional)

### 4.2 Base URL modes

* relative: `/api`
* absolute: `https://api.domain.com`
* runtime config: `${config.apiBase}`

### 4.3 Request presets

DataSource boleh menyediakan preset:

* `contentTypeDefault`
* `acceptDefault`
* `withCredentialsDefault` (true/false)

### 4.4 Observability

DataSource wajib punya hooks:

* `onRequest`, `onResponse`, `onError`
  untuk logging / tracing / metrics (bisa no-op).

---

## 5) Transport & Response Type Spec

Frontend runtime harus mendukung bentuk request/response berikut:

### 5.1 Request Body Types

* `json`
* `formUrlEncoded`
* `multipart` (file upload)
* `text` (markdown raw)
* `none`

### 5.2 Response Types

* `json`
* `text`
* `html` (treated as text, optionally sanitized/isolated)
* `blob` (download)
* `stream` (SSE optional v1)

### 5.3 Error normalization

Semua error harus dinormalisasi menjadi format internal:

* `status`
* `code` (best-effort)
* `message`
* `details`
* `raw`

> Agar UI bisa menampilkan error konsisten walau backend beda-beda.

---

## 6) Resource Spec (CRUD tapi fleksibel)

Resource bukan sekadar “entity”; ini adalah **kontrak data endpoint**.

### 6.1 Resource shape

* `id`
* `datasourceRef`
* `idField` (default `id`)
* `endpoints`:

  * `list`: method+path+queryMapping
  * `get`: method+path
  * `create`: method+path+bodyMapping
  * `update`: method+path+bodyMapping
  * `delete`: method+path
* `pagination`:

  * request: page/limit OR cursor
  * response: total/items OR nextCursor
* `search` mapping
* `sort` mapping
* `filter` mapping
* `responseMapping` (extract `data` path, e.g. `{ok,data,meta}`)

### 6.2 Response envelope adapters (wajib)

Resource harus bisa mendefinisikan adaptor:

* `extractItems(resp)`
* `extractItem(resp)`
* `extractMeta(resp)`
* `extractError(resp)`

Tanpa ini, frontend akan tersandera oleh format backend tertentu.

---

## 7) Action Spec (command endpoints)

Actions adalah pembeda utama dari scaffold biasa.

### 7.1 Action shape

* `id`
* `datasourceRef`
* `method`, `path`
* `pathParams` mapping
* `query` mapping
* `body`:

  * type: json/multipart/text/none
  * mapping from UI context
* `responseType`: json/text/html/blob
* `successHandling`:

  * toast message
  * redirect
  * invalidate queries (resource list/detail)
  * openNewTab (untuk preview URL)
  * downloadFile
* `errorHandling`:

  * toast
  * form errors mapping (field-level)
  * fallback display

### 7.2 Action contexts (wajib)

Action bisa dipanggil dari:

* Page-level (global buttons)
* Row-level (per item di table)
* Form-level (submit)
* Selection-level (bulk actions)
* Scheduled (optional; v1)

### 7.3 Preconditions

Action bisa punya:

* `confirmDialog`
* `enabledIf` (jsonlogic-like)
* `visibleIf`

---

## 8) Auth & Security Spec

Frontend core harus mendukung beberapa strategi auth secara pluggable.

### 8.1 AuthStrategy types

* `cookieSession`

  * `withCredentials=true`
* `bearerToken`

  * token storage policy: memory/localStorage
* `apiKeyHeader`
* `custom` (extension hook)

### 8.2 CSRF support (penting untuk PHP session)

CSRF strategy:

* `none`
* `doubleSubmitCookie`
* `fetchTokenEndpoint`

  * fetch `/admin-api/csrf` → token
  * attach `X-CSRF-Token`

### 8.3 Route guards

Routes bisa butuh:

* `public`
* `authenticated`
* `role:admin/staff/member`
* redirect rules

### 8.4 Multi-auth per datasource

Satu app bisa punya:

* datasource A cookieSession
* datasource B bearer
  Jadi Auth harus bersifat **per datasource**, bukan global saja.

---

## 9) Query/Cache Runtime Spec

Frontend harus punya caching yang “cukup” tanpa memaksa user mikir terlalu dalam.

### 9.1 Query keys

* resource list: `["resource", id, "list", paramsHash]`
* resource detail: `["resource", id, "detail", entityId]`
* action result: optional

### 9.2 Invalidation rules

Action dapat mendeklarasikan:

* invalidate resource list
* invalidate specific item
* optimistic update (optional)

### 9.3 Retry & timeout

* per datasource defaults
* per request override

> Implementasi bisa memakai TanStack Query, atau runtime minimal sendiri. Yang penting: IR tidak mengunci library.

---

## 10) UI Binding Spec (Forms, Tables, Pages)

Ini yang membuat “admin posts” bisa dibuat tanpa special-case.

### 10.1 TablePage

* `resourceRef` + list endpoint mapping
* columns
* filters
* row actions (ActionRef)
* bulk actions
* pagination UI mapping (page/limit vs cursor)
* empty state + error state

### 10.2 FormPage

* mode: create/update/custom
* initial data:

  * from resource get
  * or action fetch
* submit:

  * resource create/update OR action
* field error mapping:

  * from normalized error details

### 10.3 CustomPage

* layout blocks (tabs/panels)
* can run queries and render results
* can mount custom components (component registry)

### 10.4 File upload component (wajib)

* input file
* preview
* maps to multipart action
* supports multiple files optional

### 10.5 Text editor component (wajib minimal)

Untuk posts admin:

* `TextAreaEditor` (default)
  Optional plugin:
* `MarkdownEditor` (Monaco/CodeMirror) via extension mapping

---

## 11) Extensibility & Plugin Points (harus formal)

Frontend core harus punya registry serupa backend:

### 11.1 Component registry

* map `componentKey` → React component
* core menyediakan default components
* extension dapat menambahkan komponen (mis. MarkdownEditor)

### 11.2 Auth strategy registry

* register `authStrategy("cookieSession")`
* register `csrfStrategy("fetchTokenEndpoint")`

### 11.3 Response adapter registry

* register `envelopeAdapter("ok_data_meta")`
* register `envelopeAdapter("wp_rest")` (contoh)
* resource memilih adapter

### 11.4 Page templates registry

* `tablePage`
* `formPage`
* dsb.

> Semua registry ini harus tersedia lewat ExtensionContext (mirip kontrak extension Anda sekarang).

---

## 12) Kontrak “Publisher Admin” sebagai Bukti Fleksibilitas (Acceptance Driver)

Frontend core dianggap “selesai” kalau bisa membangun admin posts dengan **tanpa special-case**. Artinya admin posts hanya memanfaatkan:

* datasource `publisherApi` (base `/admin-api`)
* resource `posts` (list/get/save) *atau* actions
* actions:

  * publish
  * preview (responseType html)
  * upload media (multipart)
* pages:

  * posts list (table)
  * posts editor (form + textarea)
  * media library (table + upload)

Jika ini bisa dibangun “dari DSL”, maka frontend core benar-benar general-purpose.

---

## 13) Kontrak “Internal App” (opsional) sebagai bukti kedua

Internal app (members CRUD) harus bisa:

* datasource `internalApi` (base `/api`)
* resource `members` CRUD JSON
* pages list+form+detail
* auth cookie session

---

## 14) CLI & Packaging (yang harus didukung core)

Frontend core CLI harus bisa:

* generate **multiple frontend apps** dalam satu proyek output:

  * `frontend-admin` → `public/admin`
  * `frontend-app` → `public/app`
    atau satu target frontend dengan “apps” array.

Yang penting: generator bisa menulis dua bundle ke dua basePath.

---

## 15) Testing & Golden (quality gate)

### 15.1 Golden outputs minimal

* router config (basePath)
* datasource runtime config
* action wiring (publish/preview/upload)
* auth guard & CSRF wiring
* envelope adapters

### 15.2 Runtime smoke tests

* mock server responses
* verify:

  * list renders
  * publish triggers invalidation
  * preview opens new tab
  * upload sends multipart

---

## 16) Minimal IR fields yang harus ada (ringkasan)

Agar emitter tidak “mengarang”, Frontend TargetIR minimal memuat:

* `apps[]`:

  * `id`, `basePath`, `routes[]`
  * `datasources[]`
  * `resources[]`
  * `actions[]`
  * `auth[]` (strategies)
  * `uiRegistry[]` (component refs)
  * `runtimeConfig` (optional)
* `envelopeAdapters[]` (or references)

---

# Catatan Implementasi Strategis (agar tidak meledak)

Kalau Anda ingin mengimplement ini bertahap tanpa menunggu “sempurna”, urutan paling aman:

1. **DataSource + Action (responseType json/text/html/blob + multipart)**
2. **Envelope adapters + error normalization**
3. **Auth cookieSession + CSRF fetchToken**
4. **Multi-app output + basePath routing**
5. **Resource CRUD + query cache + invalidation**
6. **Component registry (MarkdownEditor optional)**
7. SSE optional v1

---

## Output yang Anda dapat dari spec ini

Dengan spec ini, core frontend irgen bisa:

* membangun admin posts (publisher API PHP)
* membangun internal app (REST PHP)
* membangun dashboard yang terhubung ke SaaS mana pun
* tanpa Anda menambah “mode khusus posts” di core
