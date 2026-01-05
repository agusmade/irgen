# 📘 irgen Documentation — Part 3

## Static Site Target: HTML-First Rendering & Progressive Enhancement

---

## 12. The Static Site Target

### 12.1 What “Static Site” Means in irgen

In irgen, a **static site** is defined by **output guarantees**, not by tooling:

* HTML is **fully rendered at build time**
* HTML alone is sufficient to read and navigate the site
* CSS controls presentation
* JavaScript is **optional** and only used for enhancement
* No client-side framework is required at runtime

This is fundamentally different from:

* SPA frameworks
* CSR-first React apps
* Hydrated component trees

> **HTML is the source of truth.**

---

### 12.2 Why Static Site Is a Separate Target

Although React SSG also produces static HTML, it still assumes:

* a JavaScript runtime
* hydration
* component lifecycle

The Static Site target exists to support use cases where:

* longevity matters more than interactivity
* JS should be optional
* output must remain readable for years

Typical use cases:

* documentation
* specifications
* reference material
* long-lived technical content

---

## 13. Static Site Rendering Model

### 13.1 HTML-First Contract

For the Static Site target, irgen enforces the following contract:

* Every page must produce a valid, complete HTML document
* Navigation must work via standard links (`<a href>`)
* Content must be visible with JavaScript disabled
* No runtime DOM generation is allowed

If a feature violates this contract, it must:

* degrade,
* fall back,
* or be skipped with a warning.

---

### 13.2 Structure Comes from TargetIR

Static Site rendering does **not** interpret DSL directly.

The flow is:

```
DSL
 ↓
FrontendIR
 ↓
Lowering (policy + constraints)
 ↓
StaticSiteTargetIR
 ↓
HTML Emitter
```

`StaticSiteTargetIR` contains:

* resolved page structure
* layout hierarchy
* navigation trees
* capability flags
* metadata (titles, descriptions, canonical URLs)

The emitter simply serializes this structure into HTML.

---

## 14. Progressive Enhancement Model

### 14.1 Enhancement Is Optional by Design

JavaScript in Static Site is **never required**.

Enhancement scripts may:

* attach event listeners
* toggle classes
* enhance usability

But they must **never**:

* generate core content
* replace rendered HTML
* block initial readability

---

### 14.2 Examples of Valid Enhancements

Common enhancements include:

* sidebar collapse / toggle
* copy-to-clipboard buttons for code blocks
* client-side search
* theme switching (light/dark)
* scroll position indicators

All enhancements must:

* be discoverable from TargetIR capabilities
* be included only when required
* fail gracefully when JS is disabled

---

### 14.3 Capability-Driven JavaScript Emission

The Static Site emitter decides whether to include `app.js` based on capabilities.

Example logic:

* No enhancements used → no JS emitted
* `copyCode` used → include minimal clipboard handler
* `search` used → include search runtime only

This guarantees:

* minimal payload
* predictable output
* no hidden dependencies

---

## 15. Component Degradation Rules

Not all frontend components are compatible with static HTML.

irgen handles this explicitly.

### 15.1 Degradation Categories

Components fall into three categories:

1. **Static-safe**

   * headings
   * paragraphs
   * lists
   * tables
   * code blocks
   * navigation

2. **Enhanceable**

   * tabs
   * accordions
   * collapsible sections

3. **Incompatible**

   * dynamic forms
   * async widgets
   * stateful components

---

### 15.2 Degradation Strategy

During lowering:

* Enhanceable components are converted into readable static structures
  (e.g. tabs → stacked sections)

* Incompatible components are:

  * replaced with placeholders, or
  * skipped with explicit warnings

Silent failure is forbidden.

This ensures:

* content integrity
* predictable output
* debuggable builds

---

## 16. Code Blocks and Highlighting

### 16.1 Code Rendering Guarantees

For Static Site:

* Code blocks are rendered as semantic HTML:

  ```html
  <pre><code class="language-ts">...</code></pre>
  ```
* Inline code uses `<code>` elements
* Copy buttons are optional enhancements

---

### 16.2 Highlighting Strategies

Highlighting is a **policy decision**, resolved in lowering.

Supported modes:

* `none`
  Plain code, styled via CSS only

* `pre` (recommended)
  Syntax highlighting at build time
  Output is tokenized HTML
  No runtime dependency

* `client`
  Client-side highlighter
  Included only if explicitly enabled

Static Site defaults to **pre-highlight** when highlighting is enabled.

---

## 17. CSS Responsibilities

### 17.1 CSS Is Part of the Contract

For Static Site:

* CSS defines layout, typography, and visual hierarchy
* HTML must not rely on JS to “look correct”

CSS responsibilities include:

* readable typography
* consistent spacing
* navigation layout
* code block styling
* responsive behavior

---

### 17.2 Design Tokens

Static Site CSS is typically driven by:

* CSS variables
* shared design tokens

This allows:

* visual consistency with React targets
* theming (light/dark)
* long-term maintainability

---

## 18. Accessibility & SEO Guarantees

Static Site output must satisfy baseline guarantees:

### Accessibility

* semantic HTML landmarks
* keyboard navigation
* readable contrast
* usable without JS

### SEO

* meaningful `<title>`
* meta description
* crawlable links
* stable URLs
* sitemap support (optional but recommended)

Because content is static, SEO behavior is predictable and robust.

---

## 19. Routing and Base URLs

Static Site routing is **filesystem-based**:

* `/docs/getting-started/` → `docs/getting-started/index.html`
* Trailing slashes are enforced consistently

All links and assets are generated using:

* `baseUrl` from policy
* resolved during lowering

This makes Static Site compatible with:

* subpath hosting
* GitHub Pages
* CDN deployments

---

## 20. What Static Site Explicitly Does Not Do

Static Site intentionally avoids:

* client-side routing
* hydration
* runtime data fetching
* framework-specific behavior

These are not limitations—they are **design boundaries**.

---

## Status

👉 **Part 3 complete**

Covered in this part:

* Static Site philosophy
* HTML-first guarantees
* Progressive enhancement
* Capability-based JS
* Component degradation rules
* Code highlighting strategies
* CSS, accessibility, and SEO responsibilities

---

### Next: Part 4

**Part 4** will cover:

* React SSG lifecycle in irgen
* Route discovery & prerendering
* Metadata injection
* Build output contracts
* Combining React SSG with Static Site
* Deployment patterns (including GitHub Pages)
