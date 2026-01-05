## 1) Contoh default policy object (Static-Enhanced v1)

Berikut contoh **default** yang “aman” (JS opt-in, highlight pre, search off):

```ts
export const defaultStaticSitePolicy = {
  enabled: true,

  // URL & routing
  baseUrl: "/",
  trailingSlash: true, // output /docs/foo/index.html

  // Output / build contract
  outDir: ".", // output langsung ke folder target
  customCssPath: "path/to/custom.css", // optional: merge into generated CSS
  assets: {
    hashing: true, // cache busting: style.<hash>.css, app.<hash>.js
    publicDir: "public", // optional: copy-through assets
  },

  // Enhancement capabilities (JS only if list not empty AND used)
  enhancements: {
    enabled: true,
    features: [
      // keep v1 minimal
      "sidebarToggle",
      "copyCode",
      // "themeToggle",
      // "tocScrollSpy",
      // "tabs",
      // "accordion",
      // "search",
    ] as const,
  },

  // Code blocks
  codeHighlight: {
    mode: "pre" as "pre" | "client" | "none",
    // mode=pre: highlight at build-time, HTML tokenized output
    theme: "github-dark", // optional; ignored if mode=none
    addCopyButton: true,
  },

  // Search
  search: {
    mode: "none" as "none" | "client_index" | "remote",
    indexFile: "assets/search-index.json",
    // runtimeLib: "minisearch" // only if mode=client_index
  },

  // SEO
  seo: {
    defaultTitle: "irgen Documentation",
    titleTemplate: "%s · irgen",
    defaultDescription: "Compiler-style code generation via Intermediate Representation (IR).",
    canonicalBaseUrl: null as string | null,
    sitemap: { enabled: true },
    robotsTxt: { enabled: true },
    openGraph: { enabled: false },
  },

  // Theming
  theme: {
    mode: "auto" as "light" | "dark" | "auto",
    accentColor: "#3b82f6",
    radius: "md" as "sm" | "md" | "lg",
  },

  // Security-ish
  security: {
    csp: {
      enabled: false, // v1 off by default (often depends on hosting)
      value: "default-src 'self'; base-uri 'self'; object-src 'none'", // optional override
    },
    externalLinks: {
      noopener: true,
      noreferrer: true,
    },
  },
} as const;
```

Catatan penting: untuk menjaga prinsip Anda, emitter `package.json` target static harus menambahkan dependency **hanya** jika:

* `enhancements.features` mengandung sesuatu yang butuh runtime lib, **dan**
* IR menunjukkan komponen itu benar-benar dipakai (capability used).

---

## 2) Jawaban pertanyaan (DSL sama, beda di TargetIR/emit?)

**Ya, pada prinsipnya benar**: DSL bisa sama dengan target React, lalu perbedaannya ditangani di **lowering → TargetIR → emitter**.

Namun ada satu “syarat desain” supaya tetap enak:

### A. DSL tetap sama, tapi TargetIR harus “HTML-first”

* TargetIR untuk static sebaiknya berupa **tree markup/layout** yang bisa di-render langsung jadi HTML.
* Untuk target React, TargetIR bisa berupa **component tree** yang berujung ke JSX/TSX.

### B. Komponen “interaktif” perlu strategi

Ada 3 kategori komponen DSL:

1. **Pure static** → 1:1 bisa di-render ke HTML (heading, paragraph, table, code, nav).
2. **Enhanceable** → HTML punya bentuk final, JS hanya menambah UX (sidebar toggle, tabs).
3. **React-only** (atau app-like) → tidak cocok untuk static murni tanpa perubahan besar (form kompleks, async select, stateful widgets).

Untuk kategori (3), Anda punya pilihan yang tetap menjaga “DSL sama”:

* **degrade/fallback** di target static (mis. tampilkan versi read-only, atau link ke halaman lain),
* atau **policy gate**: komponen itu hanya diizinkan untuk target tertentu,
* atau **capability transform**: lowering mengubahnya jadi markup statis + enhancement minimal kalau memungkinkan.

Jadi: *DSL bisa sama*, tapi target static perlu “kontrak perilaku” jelas untuk komponen yang tidak masuk definisi static-enhanced.
