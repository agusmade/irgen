# irgen — Ringkasan Identitas & Positioning

## 1 Nama Proyek

* **Nama resmi**: `irgen`
* **Penulisan**: selalu lowercase
* **Alasan**:

  * konsisten dengan tooling modern (`esbuild`, `vite`, `pnpm`)
  * CLI & package-friendly
  * netral dan global

---

## 2 Deskripsi Inti (One-liner)

Gunakan ini di npm, GitHub description, dan SEO meta description.

> **irgen is a compiler-style code generation toolchain built around Intermediate Representation (IR).**

Versi sedikit lebih “naratif” (opsional):

> **irgen is a policy-driven, IR-based code generation toolchain for backend, frontend, and beyond.**

---

## 3 Tagline Utama (pilih satu)

### Rekomendasi utama (paling seimbang)

> **Compiler-style code generation via Intermediate Representation.**

### Alternatif (lebih human-friendly)

> **Write domain and policy. Let irgen handle the rest.**

### Alternatif (lebih tegas & teknis)

> **Code generation that behaves like a compiler.**

👉 **Saran**:

* README & npm → tagline pertama
* Website hero section → tagline kedua (lebih ramah)

---

## 4 Opening README (ringkasan fungsi)

Digunakan tepat setelah judul `# irgen`.

> irgen is a compiler-style code generation toolchain built around Intermediate Representation (IR).
>
> You describe your system in terms of **domain and policy**.
> irgen performs IR transformations and generates backend, frontend, desktop, mobile, and documentation targets for you.
>
> irgen is not a framework and not a scaffolder.
> It is designed for developers who want architectural clarity without maintaining endless glue code.

---

## 5 Positioning Statement (untuk halaman “About” / Docs intro)

> irgen treats code generation as a compilation problem.
>
> Instead of generating code directly from templates, irgen transforms your system description through explicit IR stages—policy, domain, target, and emit—making multi-target generation deterministic, auditable, and maintainable over time.

---

## 6 “What irgen is NOT” (penting untuk menyaring audience)

Gunakan di README atau Docs.

> irgen is **not**:
>
> * a framework
> * a scaffolding tool
> * a template generator
> * an AI-driven code writer

> irgen focuses on **architecture and determinism**, not convenience shortcuts.

---

## 7 Target Audience (internal clarity, tidak harus ditulis semua)

irgen cocok untuk:

* backend / frontend engineer senior
* system & platform engineer
* developer yang lelah glue code & boilerplate
* orang yang peduli *generation gap* dan long-term maintainability

irgen **bukan** untuk:

* beginner yang ingin hasil instan
* one-off prototype cepat
* developer yang ingin “magic”

---

## 8 Kata Kunci (SEO / npm keywords)

Gunakan sebagian (tidak perlu semua):

* `codegen`
* `code-generation`
* `ir`
* `intermediate-representation`
* `compiler`
* `toolchain`
* `dsl`
* `backend`
* `frontend`
* `multi-target`
* `architecture`
* `deterministic`

---

## 9 Konsistensi Penulisan (mini style guide)

* Nama proyek: **irgen**
* Konsep teknis:

  * **IR** (capital)
  * **DSL**
  * **lowering**
  * **emitter**
* Hindari:

  * “AI-powered”
  * “magic”
  * “automatic everything”

---

## 10 Inti Filosofi (kalimat pegangan pribadi)

Kalau suatu saat bingung arah proyek, pegang ini:

> **irgen exists to move complexity from developers to a well-defined compilation pipeline.**
