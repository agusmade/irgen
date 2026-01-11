# Static-Site Target Implementation Plan

This document lays out the work order for implementing the static-site target based on `STATICSITE-CHECKLIST.md` and `staticsite-policy-draft.md`.

---

## Phase 1: Foundation & Target Setup (Core Infrastructure)

### 1.1 TargetIR Type Definition
**File:** `src/ir/target/static-site.ts`

- [x] Define `StaticSiteTargetIR` interface (extends `FrontendIR`)
- [x] Define `StaticSitePolicies` interface structure
- [x] Export types for use in lowering and emitter

**Dependencies:** None  
**Estimated Time:** 30 minutes

### 1.2 Policy Schema Definition
**File:** `src/ir/target/static-site.policy.ts`

- [x] Define zod schemas for static-site policies based on `staticsite-policy-draft.md`:
  - [x] `StaticSitePolicySchema` with all fields:
    - `enabled`, `baseUrl`, `trailingSlash`
    - `outDir`, `assets` (hashing, publicDir)
    - `enhancements` (enabled, features array)
    - `codeHighlight` (mode, theme, addCopyButton)
    - `search` (mode, indexFile)
    - `seo` (defaultTitle, titleTemplate, defaultDescription, canonicalBaseUrl, sitemap, robotsTxt, openGraph)
    - `theme` (mode, accentColor, radius)
    - `security` (csp, externalLinks)
- [x] Export `normalizeStaticSitePolicy()` function
- [x] Define default policy values

**Dependencies:** 1.1  
**Estimated Time:** 1-2 hours

### 1.3 Target Lowering
**File:** `src/lowering/targets/to-static-site.ts`

- [x] Implement `frontendDomainToStaticSiteTarget()` function
- [x] Register transform `"static-site-target"` with the lowering engine
- [x] Register policy schema with the lowering engine
- [x] Resolve policies with defaults
- [x] Transform FrontendIR into the StaticSiteTargetIR structure

**Dependencies:** 1.1, 1.2  
**Estimated Time:** 1 hour

### 1.4 Mapper Registration
**File:** `src/mappers/index.ts`

- [x] Register mapper `"static-site"` that shares the `frontend` mapper (same as electron)

**Dependencies:** 1.3  
**Estimated Time:** 15 minutes

### 1.5 CLI Integration
**File:** `src/cli.ts`

- [x] Add `"static-site"` to the list of valid targets
- [x] Add import for `to-static-site.ts` transform registration
- [x] Update `pickPolicy` to recognize the `static-site` or `staticSite` namespace

**Dependencies:** 1.3  
**Estimated Time:** 30 minutes

### 1.6 Emitter Registration
**File:** `src/emit/registry.ts`

- [x] Register target-emitter mapping: `"static-site" → "static-site-html"`
- [x] Update `src/index.ts` to support the static-site target in the Codegen class

**Dependencies:** 1.5  
**Estimated Time:** 15 minutes

---

## Phase 2: Core HTML Emitter (Basic Rendering)

### 2.1 Emitter Structure
**File:** `src/emit/static-site/static-site-html.ts`

- [x] Create emitter function signature: `emitStaticSite(ir: StaticSiteTargetIR, outDir: string)`
- [x] Register emitter `"static-site-html"` with the emitter engine
- [x] Setup output directory structure (root output or per policy)

**Dependencies:** 1.1, 1.6  
**Estimated Time:** 30 minutes

### 2.2 HTML Page Generation (Core)
- [x] Implement function to generate a single HTML page
- [x] Basic HTML structure: `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`
- [x] Generate `<title>` from page meta or policy default
- [x] Generate basic `<meta>` tags (charset, viewport)
- [x] Generate page content structure (semantic HTML: `<header>`, `<nav>`, `<main>`, `<footer>`)

**Dependencies:** 2.1  
**Estimated Time:** 2-3 hours

### 2.3 Routing & File Structure
- [x] Implement routing logic to generate file paths:
  - [x] `index.html` for root
  - [x] `docs/<slug>/index.html` for nested routes (trailing slash)
  - [x] Handle `trailingSlash` policy
- [x] Generate folder structure according to routes

**Dependencies:** 2.2  
**Estimated Time:** 1-2 hours

### 2.4 Content Rendering (Static Components)
- [x] Render headings (`<h1>` - `<h6>`) from the component tree
- [x] Render paragraphs (`<p>`)
- [x] Render lists (ordered/unordered)
- [x] Render tables (basic table structure)
- [x] Render code blocks: `<pre><code class="language-xxx">...</code></pre>` (plain for now)
- [x] Render links with proper escaping

**Dependencies:** 2.2  
**Estimated Time:** 3-4 hours

### 2.5 Navigation & Layout
- [x] Generate sidebar/navigation HTML from the pages structure
- [x] Generate breadcrumbs (if needed)
- [x] Generate header/footer HTML
- [x] Layout grid structure (CSS classes for layout)

**Dependencies:** 2.4  
**Estimated Time:** 2-3 hours

---

## Phase 3: CSS Generation

### 3.1 Base CSS
**File:** `src/emit/static-site/css.ts`

- [x] Generate `assets/style.css`
- [x] Base typography styles
- [x] Layout grid (header/sidebar/content)
- [x] Basic component styles (headings, paragraphs, lists, tables, links)

**Dependencies:** 2.5  
**Estimated Time:** 2-3 hours

### 3.2 Theme Support (CSS Variables)
- [x] Define CSS variables for theming:
  - `--bg`, `--fg`, `--muted`, `--accent`
  - Light and dark theme variants
- [x] Generate theme switching via `data-theme="dark"` attribute
- [x] Apply theme colors to all components

**Dependencies:** 3.1  
**Estimated Time:** 1-2 hours

### 3.3 Code Block Styling
- [x] Styling for `<pre><code>` blocks
- [x] Support for plain code (mode=none)
- [x] Prepare structure for highlighted code (for Phase 4)

**Dependencies:** 3.1  
**Estimated Time:** 1 hour

### 3.4 Custom CSS Support
- [x] Support `staticSite.customCssPath` or merge from the `public/` folder
- [x] Merge custom CSS with generated CSS

**Dependencies:** 3.2  
**Estimated Time:** 30 minutes

---

## Phase 4: Code Highlighting

### 4.1 Build-time Highlighting (Mode: `pre`)
- [x] Integrate syntax highlighter library (e.g., `shiki` or `prism`) at build time
- [x] Highlight code blocks at emit time (not runtime)
- [x] Generate tokenized HTML with classes for styling
- [x] Apply theme for highlighted code
- [x] Add dependency only for build-time (not included in the client bundle)

**Dependencies:** 3.3  
**Estimated Time:** 2-3 hours

### 4.2 Copy Button (Enhanced Code Block)
- [x] Add copy button HTML structure to code blocks
- [x] Mark with `data-irgen-copy-code` attribute
- [x] Style copy button (visible via CSS, enhanced by JS in Phase 6)

**Dependencies:** 4.1  
**Estimated Time:** 30 minutes

### 4.3 Client-side Highlighting (Mode: `client`) - Optional
- [x] Generate `<script>` to load Prism.js or similar (only if mode=client)
- [x] Defer script loading
- [x] Only include if code blocks exist in the IR

**Dependencies:** 4.1  
**Estimated Time:** 1-2 hours (optional for v1)

---

## Phase 5: SEO & Metadata

### 5.1 Meta Tags
- [x] Generate `<meta name="description">` from page meta or policy default
- [x] Generate `<title>` with template support (`titleTemplate`)
- [x] Generate canonical URL (if `canonicalBaseUrl` is set)

**Dependencies:** 2.2  
**Estimated Time:** 1 hour

### 5.2 OpenGraph Tags (Optional)
- [x] Generate OpenGraph meta tags if `seo.openGraph.enabled`
- [x] og:title, og:description, og:type, og:url

**Dependencies:** 5.1  
**Estimated Time:** 30 minutes

### 5.3 Sitemap Generation
- [x] Generate `sitemap.xml` from the pages structure
- [x] Include all pages with proper URLs
- [x] Only generate if `seo.sitemap.enabled`

**Dependencies:** 2.3  
**Estimated Time:** 1 hour

### 5.4 Robots.txt
- [x] Generate `robots.txt` with basic rules
- [x] Only generate if `seo.robotsTxt.enabled`

**Dependencies:** 2.3  
**Estimated Time:** 15 minutes

### 5.5 Heading Structure Validation
- [x] Ensure valid heading hierarchy (one H1 per page, proper nesting)
- [x] Generate TOC structure if needed

**Dependencies:** 2.4  
**Estimated Time:** 30 minutes

---

## Phase 6: JavaScript Enhancements (Progressive Enhancement)

### 6.1 Enhancement Detection & Dependency Tracking
- [x] Track which enhancements are actually used in IR:
  - [x] Check for `sidebarToggle` capability
  - [x] Check for `copyCode` capability (code blocks)
  - [x] Check for `themeToggle` capability
  - [x] Check for `tocScrollSpy` capability
- [x] Only emit `assets/app.js` if any capabilities are used

**Dependencies:** 4.2  
**Estimated Time:** 1 hour

### 6.2 Base Enhancement JS
**File:** `src/emit/static-site/enhancements.ts`

- [x] Create `assets/app.js` structure
- [x] Base event listener setup using `data-irgen-*` attributes
- [x] No DOM rebuilding, only enhancements

**Dependencies:** 6.1  
**Estimated Time:** 1 hour

### 6.3 Sidebar Toggle
- [x] Implement sidebar toggle functionality
- [x] Use `data-irgen-sidebar-toggle` attribute
- [x] Toggle `aria-expanded` and `aria-controls`
- [x] Fallback: sidebar always visible if JS is off

**Dependencies:** 6.2  
**Estimated Time:** 1 hour

### 6.4 Copy Code Button
- [x] Implement copy-to-clipboard functionality
- [x] Use `data-irgen-copy-code` attribute
- [x] Show feedback (toast or inline message)
- [x] Fallback: button remains but is not functional without JS (acceptable)

**Dependencies:** 6.2  
**Estimated Time:** 1 hour

### 6.5 Theme Toggle (Optional)
- [x] Implement theme toggle (light/dark)
- [x] Persist preference to localStorage
- [x] Toggle `data-theme` attribute on `<html>`
- [x] Fallback: use system preference if JS is off

**Dependencies:** 6.2, 3.2  
**Estimated Time:** 1-2 hours

### 6.6 TOC Scroll Spy (Optional)
- [x] Implement scroll spy for table of contents
- [x] Highlight current section in the TOC
- [x] Smooth scroll to sections

**Dependencies:** 6.2  
**Estimated Time:** 1-2 hours (optional for v1)

---

## Phase 7: Asset Management

### 7.1 Asset Hashing
- [x] Implement asset hashing for CSS and JS files
- [x] Generate filenames: `style.<hash>.css`, `app.<hash>.js`
- [x] Update HTML references with hashed filenames
- [x] Only if `assets.hashing` is enabled

**Dependencies:** 3.1, 6.2  
**Estimated Time:** 1 hour

### 7.2 Static Assets
- [x] Copy static assets from the `public/` folder (if any)
- [x] Copy fonts (woff2) with preload hints
- [x] Copy icons/images (svg, png)

**Dependencies:** 2.1  
**Estimated Time:** 1 hour

### 7.3 JS Defer & Performance
- [x] Add `defer` attribute to `<script>` tags
- [x] Ensure no blocking scripts
- [x] Optimize JS bundle size (minimal dependencies)

**Dependencies:** 6.2  
**Estimated Time:** 30 minutes

---

## Phase 8: Security & Accessibility

### 8.1 HTML Escaping
- [x] Ensure all dynamic content is properly escaped
- [x] Escape HTML in code blocks and text content
- [x] Use proper encoding for special characters

**Dependencies:** 2.4  
**Estimated Time:** 1 hour

### 8.2 CSP Support
- [x] Generate CSP meta tag if `security.csp.enabled`
- [x] Configure CSP headers (or meta tag) per policy

**Dependencies:** 6.2  
**Estimated Time:** 30 minutes (optional if CSP is off by default)

### 8.3 External Links
- [x] Add `rel="noopener noreferrer"` to external links
- [x] Detect external vs internal links

**Dependencies:** 2.4  
**Estimated Time:** 30 minutes

### 8.4 Accessibility Features
- [x] Skip-to-content link
- [x] Proper landmark tags (`<header>`, `<nav>`, `<main>`, `<footer>`)
- [x] `aria-expanded`, `aria-controls` for sidebar toggle
- [x] Proper heading hierarchy
- [x] Contrast ratios for light/dark themes

**Dependencies:** 2.2, 6.3, 3.2  
**Estimated Time:** 2 hours

---

## Phase 9: Search (Optional v1)

### 9.1 Client-side Index (Mode: `client_index`)
- [x] Generate `assets/search-index.json` from pages content
- [x] Include title, description, content snippets
- [x] Only generate if `search.mode === "client_index"`

**Dependencies:** 2.4  
**Estimated Time:** 2-3 hours (optional for v1)

### 9.2 Search UI & Functionality
- [x] Generate search UI HTML
- [x] Load search library (minisearch or similar) only if needed
- [x] Implement client-side search functionality

**Dependencies:** 9.1  
**Estimated Time:** 2-3 hours (optional for v1)

---

## Phase 10: Testing & Examples

### 10.1 Example DSL Files
- [x] Create `examples/static-no-enhance.dsl.ts` (no enhancements)
- [x] Create `examples/static-with-enhance.dsl.ts` (with enhancements)
- [x] Test with minimal pages and components

**Dependencies:** Phase 1-8  
**Estimated Time:** 1-2 hours

### 10.2 Golden Tests
- [x] Add golden test for `dist/index.html`
- [x] Add golden test for `dist/assets/style.css`
- [x] Add golden test for `dist/assets/app.js` (if present)
- [x] Verify "JS off still readable" (snapshot HTML structure)

**Dependencies:** 10.1  
**Estimated Time:** 2-3 hours

### 10.3 Manual Testing Checklist
- [ ] Test: open HTML from the file system (no server)
- [ ] Test: disable JS in the browser → verify still readable and navigable
- [ ] Test: verify sidebar toggle works with JS enabled
- [ ] Test: verify copy code works
- [ ] Test: verify theme toggle works (if enabled)
- [ ] Test: verify code highlighting works (if enabled)
- [ ] Test: verify all links work
- [ ] Test: verify sitemap.xml accessible
- [ ] Test: verify robots.txt accessible

**Dependencies:** 10.1  
**Estimated Time:** 1-2 hours

### 10.4 Integration with irgen Docs
- [ ] Generate irgen docs website as static-site
- [ ] Verify fast load
- [ ] Verify sidebar navigation works
- [ ] Verify code blocks are readable + copy works
- [ ] Verify the site is readable with JS off

**Dependencies:** 10.1  
**Estimated Time:** 1 hour

---

## Implementation Order Summary

**Recommended implementation order (by dependency):**

1. **Phase 1** (Foundation) - Must do first
2. **Phase 2** (Core HTML) - Core functionality
3. **Phase 3** (CSS) - Basic styling needed
4. **Phase 4** (Code Highlighting) - Can be done in parallel with Phase 5
5. **Phase 5** (SEO) - Can be done in parallel with Phase 4
6. **Phase 6** (JS Enhancements) - Depends on Phase 2-3
7. **Phase 7** (Asset Management) - Depends on Phase 3, 6
8. **Phase 8** (Security & A11y) - Can be done throughout, but finalize here
9. **Phase 9** (Search) - Optional, can be deferred
10. **Phase 10** (Testing) - Throughout, but finalize here

---

## Key Decisions & Notes

### Target Name
- Use `"static-site"` as the target name (consistent with naming convention)
- Policy namespace: `staticSite` or `static-site` (to be decided; prefer `staticSite` for camelCase consistency)

### DSL Compatibility
- Static-site target shares FrontendIR with the React target
- Components that are not compatible (complex forms, async select) need a degradation strategy:
  - Show a read-only version
  - Show a link to an alternative page
  - Or skip rendering with a warning

### Capability-Based Dependencies
- **Critical**: Only emit JS/CSS/dependencies if a capability is actually used
- Track capabilities in the IR lowering stage
- Emitter checks capabilities before emitting assets

### HTML-First Principle
- All content must render as valid HTML without JS
- JS is only for enhancements (UX improvements)
- Degrade gracefully if JS is disabled

---

## Estimated Total Time

**Minimum Viable Product (MVP):**
- Phase 1-3, 5 (core), 8 (basic), 10 (basic): ~15-20 hours

**Full v1 Implementation:**
- All phases: ~40-50 hours

**With Optional Features:**
- Including Phase 4 (client mode), Phase 6 (all enhancements), Phase 9 (search): ~60-70 hours

---

## Exit Criteria

Static-site target considered complete when:

1. ✅ All checklist items in `STATICSITE-CHECKLIST.md` are checked
2. ✅ Can generate irgen docs website as static-enhanced
3. ✅ Fast load (no heavy runtime)
4. ✅ Sidebar navigation works (with JS)
5. ✅ Code blocks are readable + copy works (with enhancement)
6. ✅ Site remains readable and navigable with JS off
7. ✅ Golden tests pass
8. ✅ Manual testing checklist passed
