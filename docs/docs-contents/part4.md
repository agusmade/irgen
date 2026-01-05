# 📘 irgen Documentation — Part 4

## React SSG: Prerendering, Routing, and Deployment

---

## 21. React SSG in irgen

### 21.1 What React SSG Means in irgen

In irgen, **React SSG** is defined as:

* React remains the **authoring model**
* Rendering happens at **build time**
* Output is **static HTML + JS**
* Runtime behavior is still **client-side React (CSR)**

Important clarifications:

* React SSG in irgen is **not SSR runtime**
* No server is required at runtime
* Output is deployable to any static host

SSG is a **rendering mode**, not a separate frontend DSL.

---

### 21.2 Why SSG Is a Mode, Not a Target

irgen deliberately models SSG as a **policy-controlled mode** of the React frontend target.

Reasons:

* DSL remains unified
* React components are reused
* Tooling duplication is avoided
* Contributor mental model stays simple

This avoids the common fragmentation seen in ecosystems that split:

* `react`
* `react-ssg`
* `react-ssr`
  into separate tools or frameworks.

---

## 22. Rendering Mode Resolution

### 22.1 Rendering Mode as Intent

Rendering intent is expressed via policy:

```ts
frontend: {
  framework: {
    rendering: {
      mode: "ssg",
    }
  }
}
```

The value of `mode`:

* is an extensible string
* is interpreted during lowering
* determines build-time behavior

Unknown modes are allowed but may emit warnings if unsupported.

---

### 22.2 Lowering Responsibilities for SSG

When `rendering.mode` implies prerendering, lowering must:

* enable prerendering
* resolve route discovery strategy
* determine which metadata must be injected
* mark required dependencies
* populate SSG-specific TargetIR fields

After lowering, the emitter must not infer or guess SSG behavior.

---

## 23. Route Discovery and Prerendering

### 23.1 Route Sources

Routes eligible for prerendering may come from:

* FrontendIR page definitions
* router configuration
* explicit policy configuration

Example:

```ts
prerender: {
  routes: "auto",
}
```

When `routes: "auto"`:

* routes are derived from static page definitions
* dynamic routes are excluded unless explicitly resolved

---

### 23.2 Dynamic Routes

Dynamic routes (e.g. `/product/:id`) are **not prerendered by default**.

Reasons:

* static generation requires a finite route set
* data sources may be unavailable at build time

Dynamic routes may be supported in the future via:

* explicit route lists
* data adapters
* precomputed parameter sets

For now, lowering must:

* skip dynamic routes
* emit warnings
* preserve deterministic output

---

## 24. Prerendering Pipeline

### 24.1 Build-Time Flow

A typical React SSG pipeline looks like:

```
React App
 ↓
Build (Vite / bundler)
 ↓
Prerender Step
 ↓
Static HTML Files
```

The prerender step:

* executes React rendering in a Node environment
* generates HTML per route
* injects metadata into `<head>`

This step happens **after bundling**, not during runtime.

---

### 24.2 Output Contract

React SSG output must satisfy:

* One HTML file per prerendered route
* Each HTML file contains meaningful content
* JavaScript bundles are linked normally
* Hydration happens on the client

HTML files must be usable even before hydration completes.

---

## 25. Metadata Injection

### 25.1 Why Metadata Matters

For public-facing pages, metadata is critical for:

* SEO
* social previews
* accessibility
* link sharing

React SSG allows metadata to be:

* computed during build
* injected into static HTML
* consistent across hosts

---

### 25.2 Metadata Sources

Metadata may come from:

* page definitions in DSL
* FrontendIR annotations
* policy defaults

Lowering resolves:

* page titles
* descriptions
* canonical URLs
* OpenGraph tags

Emitters only inject resolved values.

---

## 26. Asset Management

### 26.1 Asset Hashing

React SSG output typically uses:

* hashed filenames for JS and CSS
* long-term caching

irgen does not impose a specific hashing strategy, but:

* lowering determines whether hashing is enabled
* emitters must follow the resolved contract

---

### 26.2 Base URLs and Subpath Hosting

React SSG must respect `baseUrl` for:

* assets
* links
* routing

This is essential for:

* GitHub Pages
* subdirectory deployments
* multi-site hosting

Base URL resolution happens during lowering, not at runtime.

---

## 27. Combining React SSG with Static Site

### 27.1 Common Deployment Pattern

A recommended pattern:

* Marketing pages → React SSG
* Documentation → Static Site

Final output structure:

```
dist/
  index.html        // React SSG
  assets/
  docs/
    index.html      // Static Site
    ...
```

This structure:

* is fully static
* works on any CDN
* requires no server logic

---

### 27.2 Build Orchestration

irgen does not mandate a specific orchestration tool.

Typical flow:

1. Build React SSG output
2. Build Static Site output
3. Merge outputs into final `dist/`
4. Deploy `dist/`

Each step is deterministic and inspectable.

---

## 28. Deployment Considerations

### 28.1 Static Hosting Compatibility

React SSG + Static Site output is compatible with:

* GitHub Pages
* Netlify
* Cloudflare Pages
* any static file server

Because output is pure static files:

* no rewrite rules are strictly required
* no server-side logic is needed

---

### 28.2 SPA Fallback Avoidance

Because pages are prerendered:

* direct URL access works
* browser refresh works
* search engine crawlers see real content

This avoids common SPA pitfalls.

---

## 29. What React SSG Explicitly Avoids

React SSG in irgen does not:

* introduce server runtimes
* depend on request-time rendering
* couple output to hosting providers
* obscure build artifacts

The goal is **predictability**, not maximal abstraction.

---

## Status

👉 **Part 4 complete**

Covered in this part:

* React SSG definition
* Rendering mode resolution
* Route discovery & prerendering
* Metadata injection
* Asset management
* Combining React SSG with Static Site
* Deployment patterns

---

### Next: Part 5 (Final)

**Part 5** will cover:

* Design constraints & non-goals
* Explicit trade-offs
* Contributor mental model
* Common pitfalls
* Why irgen intentionally avoids certain features
* How to extend irgen responsibly
