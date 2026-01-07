Berikut **BackendPolicy v1** yang sudah “diformalisasi” (format + schema + default), dengan struktur **komposisional** seperti yang Anda inginkan: *interface/jenis bisa digabung*, envelope/pagination satu pilihan, auth bisa digabung (mulai JWT). Ini mengikuti pola proyek Anda: **policy divalidasi (zod) lalu dibekukan di TargetIR; emitter cuma render**.

```ts
// src/ir/target/backend.policy.ts
import { z } from "zod";

/**
 * BackendPolicy v1
 * - interfaces: transport/interfaces yang bisa digabung (REST sekarang; lainnya nanti)
 * - envelope: kontrak response global (v1: {data,meta,error})
 * - pagination: strategi list global (v1: page/limit)
 * - auth: mekanisme auth bisa digabung (v1: JWT)
 */

export const BackendInterfaceRestPolicySchema = z
  .object({
    enabled: z.boolean().default(true),

    // Base URL untuk REST
    basePath: z.string().min(1).default("/api"),

    // OpenAPI emission
    openapi: z
      .object({
        enabled: z.boolean().default(true),
        title: z.string().min(1).default("API"),
        version: z.string().min(1).default("1.0.0"),
        // server URL optional (bisa diisi saat deploy)
        serverUrl: z.string().min(1).optional(),
      })
      .default({}),

    // Endpoint public yang tidak pakai authRequired (login/health/etc).
    // (Kalau Anda belum generate route-level auth, field ini tetap aman untuk masa depan.)
    publicRoutes: z.array(z.string().min(1)).default([]),
  })
  .default({});

export const BackendInterfacesPolicySchema = z
  .object({
    // v1 hanya REST dulu, tapi field ini disiapkan untuk gabungan interface lain.
    rest: BackendInterfaceRestPolicySchema,

    // Placeholder (belum dipakai v1): tinggal Anda isi saat sudah matang.
    // rpc: z.object({ enabled: z.boolean().default(false) }).default({}),
    // ws: z.object({ enabled: z.boolean().default(false) }).default({}),
    // socketio: z.object({ enabled: z.boolean().default(false) }).default({}),
    // sync: z.object({ enabled: z.boolean().default(false) }).default({}),
  })
  .default({});

export const BackendEnvelopePolicySchema = z
  .object({
    // v1: { data, meta, error }
    type: z.enum(["standard_v1"]).default("standard_v1"),

    // Kunci envelope (dibuat eksplisit supaya stabil dan bisa diubah di masa depan tanpa refactor besar)
    keys: z
      .object({
        data: z.string().default("data"),
        meta: z.string().default("meta"),
        error: z.string().default("error"),
      })
      .default({}),

    // Meta minimal v1
    meta: z
      .object({
        requestIdKey: z.string().default("requestId"),
        // Optional untuk masa depan: traceIdKey, tookMsKey, dll.
      })
      .default({}),

    // Error shape v1
    errorShape: z
      .object({
        codeKey: z.string().default("code"),
        messageKey: z.string().default("message"),
        detailsKey: z.string().default("details"),
      })
      .default({}),
  })
  .default({});

export const BackendPaginationPolicySchema = z
  .object({
    type: z.enum(["page_limit"]).default("page_limit"),
    defaults: z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).default(20),
        maxLimit: z.number().int().min(1).default(100),
      })
      .default({}),
    meta: z
      .object({
        pageKey: z.string().default("page"),
        limitKey: z.string().default("limit"),
        totalKey: z.string().default("total"),
        hasNextKey: z.string().default("hasNext"),
      })
      .default({}),
  })
  .default({});

export const BackendAuthJwtPolicySchema = z
  .object({
    enabled: z.boolean().default(true),

    // Pilih salah satu cara verifikasi:
    // - HS256 (secret)
    // - RS256 (JWKS URL)
    algorithm: z.enum(["HS256", "RS256"]).default("HS256"),

    // HS256
    secret: z.string().min(16).optional(),

    // RS256
    jwksUrl: z.string().url().optional(),

    issuer: z.string().min(1).optional(),
    audience: z.string().min(1).optional(),
    clockToleranceSec: z.number().int().min(0).default(30),

    // Claim mapping
    claims: z
      .object({
        subjectKey: z.string().default("sub"),
        rolesKey: z.string().default("roles"),
      })
      .default({}),
  })
  .superRefine((v, ctx) => {
    if (!v.enabled) return;

    if (v.algorithm === "HS256") {
      if (!v.secret) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "backend.auth.jwt.secret wajib untuk HS256",
          path: ["secret"],
        });
      }
      if (v.jwksUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "backend.auth.jwt.jwksUrl tidak dipakai untuk HS256",
          path: ["jwksUrl"],
        });
      }
    }

    if (v.algorithm === "RS256") {
      if (!v.jwksUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "backend.auth.jwt.jwksUrl wajib untuk RS256",
          path: ["jwksUrl"],
        });
      }
      if (v.secret) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "backend.auth.jwt.secret tidak dipakai untuk RS256",
          path: ["secret"],
        });
      }
    }
  })
  .default({});

export const BackendAuthPolicySchema = z
  .object({
    // v1: JWT dulu. Nanti bisa tambah apiKey/session/walletSig tanpa mengubah struktur besar.
    jwt: BackendAuthJwtPolicySchema,

    // Placeholder:
    // apiKey: z.object({ enabled: z.boolean().default(false) }).default({}),
    // session: z.object({ enabled: z.boolean().default(false) }).default({}),
    // walletSig: z.object({ enabled: z.boolean().default(false) }).default({}),
  })
  .default({});

export const BackendPolicySchema = z
  .object({
    interfaces: BackendInterfacesPolicySchema,
    envelope: BackendEnvelopePolicySchema,
    pagination: BackendPaginationPolicySchema,
    auth: BackendAuthPolicySchema,

    // “Core knobs” yang biasanya Anda sudah punya secara lintas target:
    // (biarkan di sini jika Anda ingin backend yang self-contained; atau taruh di root policies jika global)
    formatter: z.enum(["prettier", "biome", "none"]).default("prettier"),
    loggerImpl: z.enum(["pino", "winston", "console"]).default("console"),
  })
  .default({})
  .superRefine((p, ctx) => {
    // v1 guard: kalau REST enabled, maka envelope+pagination harus ada (sudah default),
    // dan JWT enabled jika Anda mau REST by default secured.
    if (p.interfaces.rest.enabled && !p.auth.jwt.enabled) {
      // optional: boleh dinonaktifkan untuk public API; tapi karena Anda bilang JWT dulu,
      // saya buat sebagai warning-style (custom issue).
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "REST aktif tetapi JWT dimatikan. Jika ini disengaja (public API), abaikan; jika tidak, aktifkan auth.jwt.",
        path: ["auth", "jwt", "enabled"],
      });
    }
  });

export type BackendPolicy = z.infer<typeof BackendPolicySchema>;

/**
 * Helper: normalize + apply defaults
 */
export function normalizeBackendPolicy(input: unknown): BackendPolicy {
  return BackendPolicySchema.parse(input);
}
```

### Catatan kecil yang penting untuk integrasi ke pipeline Anda

* Schema ini idealnya diregister di **lowering engine** sebagai `policies.backend` (persis gaya policy zod yang sudah Anda terapkan di target lowering). 
* Outputnya dibekukan ke `BackendTargetIR.policies.backend` sehingga emitter tinggal baca (tanpa default tersembunyi), seperti Electron checklist Anda. 

---

Siap, Bli Agus 👍
Berikut **contoh default `BackendPolicy` object** yang **netral, aman, dan realistis** untuk REST v1 — cocok dijadikan:

* default bawaan generator
* baseline untuk `--policies`
* fixture awal untuk test / golden

Saya tulis **lengkap tapi minimal** (tidak “over-configured”), sesuai dengan checklist REST v1 yang **belum dicentang**.

---

## Default BackendPolicy (REST v1)

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
    "keys": {
      "data": "data",
      "meta": "meta",
      "error": "error"
    },
    "meta": {
      "requestIdKey": "requestId"
    },
    "errorShape": {
      "codeKey": "code",
      "messageKey": "message",
      "detailsKey": "details"
    }
  },

  "pagination": {
    "type": "page_limit",
    "defaults": {
      "page": 1,
      "limit": 20,
      "maxLimit": 100
    },
    "meta": {
      "pageKey": "page",
      "limitKey": "limit",
      "totalKey": "total",
      "hasNextKey": "hasNext"
    }
  },

  "auth": {
    "jwt": {
      "enabled": true,
      "algorithm": "HS256",
      "secret": "CHANGE_ME_SUPER_SECRET_MIN_16_CHARS",
      "issuer": "example-api",
      "audience": "example-clients",
      "clockToleranceSec": 30,
      "claims": {
        "subjectKey": "sub",
        "rolesKey": "roles"
      }
    }
  },

  "formatter": "prettier",
  "loggerImpl": "console"
}
```

---

## Kenapa default ini “tepat” (bukan asal isi)

### 1️⃣ REST aktif, tapi **tidak berlebihan**

* `basePath: "/api"` → aman & konvensional
* `publicRoutes: []` → default **semua endpoint terproteksi**

  * login/health bisa ditambahkan eksplisit

---

### 2️⃣ Envelope eksplisit (tidak implicit)

* Key envelope dituliskan, walau default
* Ini **penting untuk stabilitas golden test**
* Juga membuka jalan kalau v2 mau ganti envelope tanpa refactor besar

---

### 3️⃣ Pagination realistis

* `limit=20`, `maxLimit=100` → praktik umum
* Semua key meta eksplisit → emitter tidak nebak

---

### 4️⃣ JWT **siap jalan tapi jelas “contoh”**

* `secret` jelas placeholder (tidak ambigu)
* `HS256` dipilih untuk dev / local
* `issuer` & `audience` diisi supaya:

  * verify logic nyata
  * tidak “longgar tanpa sadar”

👉 Untuk produksi tinggal override:

```json
{
  "auth": {
    "jwt": {
      "algorithm": "RS256",
      "jwksUrl": "https://example.com/.well-known/jwks.json"
    }
  }
}
```

---

### 5️⃣ Tidak mengunci masa depan

Default ini **tidak**:

* menyebut RPC
* menyebut WebSocket
* menyebut offline sync
* menyebut dApp

Semua itu bisa **ditambah tanpa mengubah object ini** secara destruktif.

---

## Contoh override kecil (realistis)

### a) Menambah public route (login)

```json
{
  "interfaces": {
    "rest": {
      "publicRoutes": ["/auth/login", "/health"]
    }
  }
}
```

### b) Matikan OpenAPI (mis. internal service)

```json
{
  "interfaces": {
    "rest": {
      "openapi": {
        "enabled": false
      }
    }
  }
}
```

---

## Cara pakai (CLI contoh)

```bash
npx irgen examples/app.dsl.ts generated/backend \
  --targets=backend \
  --policies=backend-policy.json
```

---

### Penutup (penting secara praktis)

Dengan **default policy ini**, sekarang Anda sudah punya:

* 1 kontrak backend yang jelas
* 1 baseline testable
* 1 titik awal implementasi lowering + emitter
