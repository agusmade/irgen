# 📘 irgen Documentation — Update (Part 1)

## 1. Introduction

### What is irgen?

**irgen** is a *compiler-style code generation framework* that uses **Intermediate Representation (IR)** as the core design layer.

Unlike typical generators or scaffolding tools, irgen:

* does not “print code” directly from a DSL,
* instead **translates intent → IR → TargetIR → Emitters**,
* with policy decisions made explicitly during the *lowering* stage.

> irgen is built for developers who want **control, determinism, and scalable design**, not “magic”.

---

### The Problems irgen Solves

irgen exists to solve a common pain in modern projects:

* Many output targets (backend, frontend, desktop, static-site)
* Each target has:

  * its own conventions
  * its own dependencies
  * its own configuration
* As a result:

  * boilerplate grows
  * small changes become expensive
  * architecture becomes hard to maintain

irgen solves this with:

* **a single source of truth (IR)**,
* **policy-driven transformation**,
* **deterministic emitters**.

---

## 2. Core Design Principles

### 2.1 Compiler-Style Architecture

irgen **intentionally mirrors compiler architecture**, not a UI framework or build tool.

General flow:

```
DSL
 ↓
DeclIR
 ↓
DomainIR
 ↓
TargetIR
 ↓
Emitter
 ↓
Generated Output
```

Each stage has a clear responsibility and **does not leak into other stages**.

---

### 2.2 IR Is a Contract, Not an Implementation

* IR is **not a language AST**
* IR is a **representation of intent**

Examples:

* “this is a docs page”
* “this is a REST backend”
* “this is a React frontend with prerender”
* “this is an HTML-first static site”

How that intent is realized is handled by **TargetIR + emitter**.

---

### 2.3 Policy as the Decision Maker

In irgen:

* **DSL does not make technical decisions**
* **Emitters do not interpret policy**
* **Lowering makes the decisions**

Policy:

* is read during lowering,
* produces a TargetIR that is **already decision-final**,
* emitters only execute.

This results in:

* deterministic output,
* policy changes without DSL changes,
* simpler emitters.

---

## 3. irgen DSL Model

### 3.1 DSL Entry Points

irgen splits the DSL by **application domain**, not by technology.

Common examples:

```ts
app({...})        // backend / service
frontend({...})   // UI / web / desktop
```

This separation matters so that:

* backend is not “contaminated” by frontend concerns,
* frontend can target multiple outputs (React, static-site, Electron).

---

### 3.2 DSL Is Target-Agnostic

The DSL **does not know**:

* whether frontend becomes CSR, SSG, or static-site
* whether backend becomes REST, RPC, or WebSocket

The DSL only states **what**, not **how**.

Examples:

* “this page is docs”
* “this layout has a sidebar”
* “this component is a code block”

Targets decide:

* how it is rendered,
* which dependencies are required,
* whether JS is needed at all.

---

## 4. Frontend Targets in irgen

Today irgen supports **multiple frontend output models**, each with a clear philosophy.

### 4.1 React Frontend (CSR / SSG)

React frontend in irgen:

* is emitted as a normal React app,
* but **rendering mode is driven by policy**.

#### Rendering Modes

```ts
frontend: {
  framework: {
    rendering: {
      mode: "csr" | "ssg" | string,
    }
  }
}
```

Meaning:

* `"csr"` → pure client-side React
* `"ssg"` → React remains CSR at runtime, but **prerendered at build**
* other values may exist in the future (`"islands"`, `"partial-ssg"`, etc.)

> **SSG ≠ SSR runtime**
> irgen does not require a rendering server.

---

### 4.2 Static Site (HTML-first, Progressive Enhancement)

The **static-site** target in irgen is philosophically different from React.

Key characteristics:

* final HTML is generated at build time
* no React runtime
* JS only for **progressive enhancement**
* site remains readable without JS

Used for:

* documentation
* reference
* knowledge base

Enhancement examples:

* sidebar toggle
* copy code
* client-side search
* theme toggle

---

### 4.3 Combining React SSG + Static Site

Recommended approach:

* **Home / marketing** → React + SSG
* **Docs** → Static Site

Final output:

```
dist/
  index.html        // marketing (react-ssg)
  assets/
  docs/
    index.html      // docs (static-site)
    getting-started/
```

Great for:

* CDN
* GitHub Pages
* pure static hosting

---

## 5. Static Site Philosophy (Brief)

Static Site in irgen is **not SPA** and **not React**.

Principles:

* HTML is the source of truth for UI
* CSS handles presentation
* JS only adds convenience

Goals:

* fast
* SEO-friendly
* durable
* easy to host

---

## Status

👉 **Part 1 complete**
This section covers:

* vision,
* philosophy,
* architecture,
* frontend target model.

---

### Next (Part 2 to follow):

* Policy model in detail
* Static Site lifecycle
* React SSG lifecycle
* Routing & baseUrl
* Build & deploy (including GitHub Pages)
* Design constraints & non-goals
* A simple end-to-end example
