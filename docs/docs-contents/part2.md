# 📘 irgen Documentation — Part 2

## Policy Model, Lowering, and Frontend Rendering Modes

---

## 6. The Policy Model

### 6.1 What a Policy Is (and Is Not)

In irgen, a **policy** is a **declarative statement of intent**, not an implementation detail.

A policy:

* expresses *what kind of system you want*,
* not *how the system is implemented*,
* and does **not** directly affect code emission.

A policy is **never read by an emitter directly**.

> **All policies are interpreted during lowering.**

This single rule is fundamental to irgen’s architecture.

---

### 6.2 Why Policy Exists as a First-Class Concept

Without policy separation, generators tend to:

* mix configuration logic into templates,
* hardcode assumptions in emitters,
* or require DSL changes for technical decisions.

irgen avoids this by enforcing:

* **DSL = intent**
* **Policy = constraints & preferences**
* **Lowering = decision point**
* **Emitter = execution only**

This makes changes:

* safer,
* more predictable,
* and easier to reason about.

---

### 6.3 Policy Scope and Structure

Policies are grouped by **target domain**, not by technology.

Typical high-level structure:

```ts
policies: {
  backend?: { ... },
  frontend?: { ... },
  staticSite?: { ... },
  electron?: { ... },
}
```

Each policy block:

* applies only to its relevant target,
* may be absent entirely,
* has sensible defaults when omitted.

Policies are **composable**, not mutually exclusive.

---

## 7. Lowering: The Decision Engine

### 7.1 What Lowering Does

Lowering is the phase where irgen:

* reads IR + policy,
* resolves ambiguities,
* applies constraints,
* and produces a **TargetIR** that is *fully decided*.

After lowering:

* there should be **no unresolved “ifs”**,
* emitters must not reinterpret policy,
* output must be deterministic.

In short:

> **Lowering turns intent into decisions.**

---

### 7.2 Responsibilities of Lowering

Lowering is responsible for:

* Selecting rendering strategies (CSR, SSG, static)
* Resolving routing behavior
* Deciding which capabilities are active
* Determining dependency requirements
* Applying fallbacks or degradations
* Emitting warnings for unsupported constructs

Lowering **may transform structure**, but must not:

* invent new intent,
* or remove user intent silently.

---

### 7.3 What Lowering Must NOT Do

Lowering must not:

* emit files,
* generate code,
* depend on runtime behavior,
* perform I/O.

Lowering is **pure, deterministic, and side-effect free**.

---

## 8. Frontend Rendering Modes

irgen supports multiple frontend rendering strategies under a **single frontend DSL**, controlled exclusively by policy.

This avoids fragmenting the DSL while allowing multiple output models.

---

### 8.1 Rendering Mode as Policy

Rendering strategy is expressed via policy, not target selection.

Example:

```ts
frontend: {
  framework: {
    rendering: {
      mode: "csr", // extensible string
    }
  }
}
```

Important characteristics:

* `mode` is a **string**, not a closed enum
* Unknown modes are allowed but may produce warnings
* Behavior is defined in lowering, not schema

This design keeps irgen **future-proof**.

---

### 8.2 CSR (Client-Side Rendering)

**CSR** is the default mode.

Characteristics:

* React renders entirely in the browser
* Initial HTML is a shell
* JavaScript is required for meaningful output

Use cases:

* internal tools
* dashboards
* non-SEO-critical apps

CSR is simple and fast to iterate on, but not ideal for public marketing pages.

---

### 8.3 SSG (Static Site Generation via React)

**SSG** in irgen means:

* React is still the authoring model
* Rendering happens at **build time**
* Output is **static HTML + JS**
* Runtime remains CSR (hydration)

Important clarifications:

* This is **not SSR runtime**
* No server is required
* Output is deployable to any static host

SSG is enabled via policy, for example:

```ts
rendering: {
  mode: "ssg",
  prerender: {
    routes: "auto",
  }
}
```

Lowering decides:

* which routes are prerendered,
* which dependencies are added,
* and how metadata is injected.

---

### 8.4 Static Site (HTML-first Target)

Static Site rendering is **not React-based**.

It is a separate target with a different philosophy:

* HTML is final and authoritative
* No React runtime
* No hydration
* JavaScript is optional and additive

Static Site is used for:

* documentation
* reference material
* content-first websites

It is controlled via its own policy block:

```ts
staticSite: {
  enabled: true,
  baseUrl: "/docs/",
}
```

Static Site and React SSG are **complementary**, not competing.

---

## 9. Capability-Based Design

### 9.1 What Is a Capability?

A capability represents a **feature requirement**, not an implementation.

Examples:

* `sidebarToggle`
* `copyCode`
* `search`
* `themeToggle`

Capabilities are:

* detected during lowering,
* based on IR structure and policy,
* and passed into TargetIR.

---

### 9.2 Why Capabilities Matter

Capabilities allow irgen to:

* include dependencies **only when needed**,
* emit JS **only when required**,
* keep static output minimal,
* and avoid feature creep in emitters.

Emitters never “guess” features.
They only act on **explicit capability flags**.

---

## 10. Degradation and Fallback Rules

Not all DSL constructs are compatible with all targets.

irgen handles this explicitly.

Examples:

* A `tabs` layout in static site → rendered as stacked sections
* A `form` component in static site → placeholder or read-only output
* A dynamic route in static site → skipped with warning

Lowering is responsible for:

* choosing the fallback,
* emitting a warning,
* and preserving readability.

Silent failure is never allowed.

---

## 11. Why irgen Avoids SSR Runtime

irgen intentionally avoids:

* server-side rendering frameworks,
* runtime servers,
* request-time rendering.

Reasons:

* complexity explosion
* hosting constraints
* harder determinism
* tighter coupling to frameworks

irgen favors:

* build-time decisions,
* static output,
* and predictable artifacts.

This makes irgen suitable for:

* CDN deployment
* GitHub Pages
* long-term maintenance

---

## Status

👉 **Part 2 complete**

Covered in this part:

* Policy philosophy
* Lowering responsibilities
* Frontend rendering modes
* CSR vs SSG vs Static Site
* Capability-based design
* Degradation rules

---

### Next: Part 3

**Part 3** will cover:

* Static Site target in detail
* HTML-first rendering rules
* Progressive enhancement model
* CSS & JS responsibility split
* Accessibility & SEO guarantees
