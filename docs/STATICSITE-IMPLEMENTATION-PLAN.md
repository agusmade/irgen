# Static-Site Target Implementation Plan

Dokumen ini menyusun urutan kerja untuk mengimplementasikan static-site target berdasarkan `STATICSITE-CHECKLIST.md` dan `staticsite-policy-draft.md`.

---

## Phase 1: Foundation & Target Setup (Core Infrastructure)

### 1.1 TargetIR Type Definition
**File:** `src/ir/target/static-site.ts`

- [x] Define `StaticSiteTargetIR` interface (extends `FrontendIR`)
- [x] Define `StaticSitePolicies` interface structure
- [x] Export types untuk digunakan di lowering dan emitter

**Dependencies:** None  
**Estimated Time:** 30 minutes

### 1.2 Policy Schema Definition
**File:** `src/ir/target/static-site.policy.ts`

- [x] Define zod schemas untuk static-site policies berdasarkan `staticsite-policy-draft.md`:
  - [x] `StaticSitePolicySchema` dengan semua fields:
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
- [x] Register transform `"static-site-target"` dengan lowering engine
- [x] Register policy schema dengan lowering engine
- [x] Resolve policies dengan defaults
- [x] Transform FrontendIR ke StaticSiteTargetIR structure

**Dependencies:** 1.1, 1.2  
**Estimated Time:** 1 hour

### 1.4 Mapper Registration
**File:** `src/mappers/index.ts`

- [x] Register mapper `"static-site"` yang share dengan `frontend` mapper (sama seperti electron)

**Dependencies:** 1.3  
**Estimated Time:** 15 minutes

### 1.5 CLI Integration
**File:** `src/cli.ts`

- [x] Add `"static-site"` ke list targets yang valid
- [x] Add import untuk `to-static-site.ts` transform registration
- [x] Update `pickPolicy` untuk recognize `static-site` atau `staticSite` namespace

**Dependencies:** 1.3  
**Estimated Time:** 30 minutes

### 1.6 Emitter Registration
**File:** `src/emit/registry.ts`

- [x] Register target-emitter mapping: `"static-site" → "static-site-html"`
- [x] Update `src/index.ts` untuk support static-site target di Codegen class

**Dependencies:** 1.5  
**Estimated Time:** 15 minutes

---

## Phase 2: Core HTML Emitter (Basic Rendering)

### 2.1 Emitter Structure
**File:** `src/emit/static-site/static-site-html.ts`

- [x] Create emitter function signature: `emitStaticSite(ir: StaticSiteTargetIR, outDir: string)`
- [x] Register emitter `"static-site-html"` dengan emitter engine
- [x] Setup output directory structure (root output atau sesuai policy)

**Dependencies:** 1.1, 1.6  
**Estimated Time:** 30 minutes

### 2.2 HTML Page Generation (Core)
- [x] Implement function untuk generate single HTML page
- [x] Basic HTML structure: `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`
- [x] Generate `<title>` dari page meta atau policy default
- [x] Generate basic `<meta>` tags (charset, viewport)
- [x] Generate page content structure (semantic HTML: `<header>`, `<nav>`, `<main>`, `<footer>`)

**Dependencies:** 2.1  
**Estimated Time:** 2-3 hours

### 2.3 Routing & File Structure
- [x] Implement routing logic untuk generate file paths:
  - [x] `index.html` untuk root
  - [x] `docs/<slug>/index.html` untuk nested routes (trailing slash)
  - [x] Handle `trailingSlash` policy
- [x] Generate folder structure sesuai routes

**Dependencies:** 2.2  
**Estimated Time:** 1-2 hours

### 2.4 Content Rendering (Static Components)
- [x] Render headings (`<h1>` - `<h6>`) dari component tree
- [x] Render paragraphs (`<p>`)
- [x] Render lists (ordered/unordered)
- [x] Render tables (basic table structure)
- [x] Render code blocks: `<pre><code class="language-xxx">...</code></pre>` (plain untuk now)
- [x] Render links dengan proper escaping

**Dependencies:** 2.2  
**Estimated Time:** 3-4 hours

### 2.5 Navigation & Layout
- [x] Generate sidebar/navigation HTML dari pages structure
- [x] Generate breadcrumbs (jika diperlukan)
- [x] Generate header/footer HTML
- [x] Layout grid structure (CSS classes untuk layout)

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
- [x] Define CSS variables untuk theming:
  - `--bg`, `--fg`, `--muted`, `--accent`
  - Light and dark theme variants
- [x] Generate theme switching via `data-theme="dark"` attribute
- [x] Apply theme colors ke semua components

**Dependencies:** 3.1  
**Estimated Time:** 1-2 hours

### 3.3 Code Block Styling
- [x] Style untuk `<pre><code>` blocks
- [x] Support untuk plain code (mode=none)
- [x] Prepare structure untuk highlighted code (untuk Phase 4)

**Dependencies:** 3.1  
**Estimated Time:** 1 hour

### 3.4 Custom CSS Support
- [x] Support `staticSite.customCssPath` atau merge dari `public/` folder
- [x] Merge custom CSS dengan generated CSS

**Dependencies:** 3.2  
**Estimated Time:** 30 minutes

---

## Phase 4: Code Highlighting

### 4.1 Build-time Highlighting (Mode: `pre`)
- [x] Integrate syntax highlighter library (mis. `shiki` atau `prism` di build-time)
- [x] Highlight code blocks saat emit (bukan runtime)
- [x] Generate tokenized HTML dengan classes untuk styling
- [x] Apply theme untuk highlighted code
- [x] Add dependency hanya untuk build-time (tidak masuk client bundle)

**Dependencies:** 3.3  
**Estimated Time:** 2-3 hours

### 4.2 Copy Button (Enhanced Code Block)
- [x] Add copy button HTML structure ke code blocks
- [x] Mark dengan `data-irgen-copy-code` attribute
- [x] Style copy button (visible via CSS, akan di-enhance dengan JS di Phase 6)

**Dependencies:** 4.1  
**Estimated Time:** 30 minutes

### 4.3 Client-side Highlighting (Mode: `client`) - Optional
- [x] Generate `<script>` untuk load Prism.js atau similar (hanya jika mode=client)
- [x] Defer script loading
- [x] Only include jika ada code blocks di IR

**Dependencies:** 4.1  
**Estimated Time:** 1-2 hours (optional untuk v1)

---

## Phase 5: SEO & Metadata

### 5.1 Meta Tags
- [x] Generate `<meta name="description">` dari page meta atau policy default
- [x] Generate `<title>` dengan template support (`titleTemplate`)
- [x] Generate canonical URL (jika `canonicalBaseUrl` set)

**Dependencies:** 2.2  
**Estimated Time:** 1 hour

### 5.2 OpenGraph Tags (Optional)
- [x] Generate OpenGraph meta tags jika `seo.openGraph.enabled`
- [x] og:title, og:description, og:type, og:url

**Dependencies:** 5.1  
**Estimated Time:** 30 minutes

### 5.3 Sitemap Generation
- [x] Generate `sitemap.xml` dari pages structure
- [x] Include all pages dengan proper URLs
- [x] Only generate jika `seo.sitemap.enabled`

**Dependencies:** 2.3  
**Estimated Time:** 1 hour

### 5.4 Robots.txt
- [x] Generate `robots.txt` dengan basic rules
- [x] Only generate jika `seo.robotsTxt.enabled`

**Dependencies:** 2.3  
**Estimated Time:** 15 minutes

### 5.5 Heading Structure Validation
- [x] Ensure valid heading hierarchy (H1 sekali per page, proper nesting)
- [x] Generate TOC structure jika diperlukan

**Dependencies:** 2.4  
**Estimated Time:** 30 minutes

---

## Phase 6: JavaScript Enhancements (Progressive Enhancement)

### 6.1 Enhancement Detection & Dependency Tracking
- [x] Track which enhancements are actually used in IR:
  - [x] Check untuk `sidebarToggle` capability
  - [x] Check untuk `copyCode` capability (code blocks)
  - [x] Check untuk `themeToggle` capability
  - [x] Check untuk `tocScrollSpy` capability
- [x] Only emit `assets/app.js` jika ada capabilities yang digunakan

**Dependencies:** 4.2  
**Estimated Time:** 1 hour

### 6.2 Base Enhancement JS
**File:** `src/emit/static-site/enhancements.ts`

- [x] Create `assets/app.js` structure
- [x] Base event listener setup menggunakan `data-irgen-*` attributes
- [x] No DOM rebuilding, hanya enhancement

**Dependencies:** 6.1  
**Estimated Time:** 1 hour

### 6.3 Sidebar Toggle
- [x] Implement sidebar toggle functionality
- [x] Use `data-irgen-sidebar-toggle` attribute
- [x] Toggle `aria-expanded` and `aria-controls`
- [x] Fallback: sidebar selalu visible jika JS off

**Dependencies:** 6.2  
**Estimated Time:** 1 hour

### 6.4 Copy Code Button
- [x] Implement copy-to-clipboard functionality
- [x] Use `data-irgen-copy-code` attribute
- [x] Show feedback (toast atau inline message)
- [x] Fallback: button tetap ada tapi tidak functional tanpa JS (acceptable)

**Dependencies:** 6.2  
**Estimated Time:** 1 hour

### 6.5 Theme Toggle (Optional)
- [x] Implement theme toggle (light/dark)
- [x] Persist preference ke localStorage
- [x] Toggle `data-theme` attribute pada `<html>`
- [x] Fallback: use system preference jika JS off

**Dependencies:** 6.2, 3.2  
**Estimated Time:** 1-2 hours

### 6.6 TOC Scroll Spy (Optional)
- [x] Implement scroll spy untuk table of contents
- [x] Highlight current section di TOC
- [x] Smooth scroll ke sections

**Dependencies:** 6.2  
**Estimated Time:** 1-2 hours (optional untuk v1)

---

## Phase 7: Asset Management

### 7.1 Asset Hashing
- [x] Implement asset hashing untuk CSS dan JS files
- [x] Generate filenames: `style.<hash>.css`, `app.<hash>.js`
- [x] Update HTML references dengan hashed filenames
- [x] Only jika `assets.hashing` enabled

**Dependencies:** 3.1, 6.2  
**Estimated Time:** 1 hour

### 7.2 Static Assets
- [x] Copy static assets dari `public/` folder (jika ada)
- [x] Copy fonts (woff2) dengan preload hints
- [x] Copy icons/images (svg, png)

**Dependencies:** 2.1  
**Estimated Time:** 1 hour

### 7.3 JS Defer & Performance
- [x] Add `defer` attribute ke `<script>` tags
- [x] Ensure no blocking scripts
- [x] Optimize JS bundle size (minimal dependencies)

**Dependencies:** 6.2  
**Estimated Time:** 30 minutes

---

## Phase 8: Security & Accessibility

### 8.1 HTML Escaping
- [x] Ensure all dynamic content is properly escaped
- [x] Escape HTML di code blocks, text content
- [x] Use proper encoding untuk special characters

**Dependencies:** 2.4  
**Estimated Time:** 1 hour

### 8.2 CSP Support
- [x] Generate CSP meta tag jika `security.csp.enabled`
- [x] Configure CSP headers (atau meta tag) sesuai policy

**Dependencies:** 6.2  
**Estimated Time:** 30 minutes (optional jika CSP off by default)

### 8.3 External Links
- [x] Add `rel="noopener noreferrer"` ke external links
- [x] Detect external vs internal links

**Dependencies:** 2.4  
**Estimated Time:** 30 minutes

### 8.4 Accessibility Features
- [x] Skip-to-content link
- [x] Proper landmark tags (`<header>`, `<nav>`, `<main>`, `<footer>`)
- [x] `aria-expanded`, `aria-controls` untuk sidebar toggle
- [x] Proper heading hierarchy
- [x] Contrast ratios untuk light/dark themes

**Dependencies:** 2.2, 6.3, 3.2  
**Estimated Time:** 2 hours

---

## Phase 9: Search (Optional v1)

### 9.1 Client-side Index (Mode: `client_index`)
- [x] Generate `assets/search-index.json` dari pages content
- [x] Include title, description, content snippets
- [x] Only generate jika `search.mode === "client_index"`

**Dependencies:** 2.4  
**Estimated Time:** 2-3 hours (optional untuk v1)

### 9.2 Search UI & Functionality
- [x] Generate search UI HTML
- [x] Load search library (minisearch atau similar) hanya jika needed
- [x] Implement client-side search functionality

**Dependencies:** 9.1  
**Estimated Time:** 2-3 hours (optional untuk v1)

---

## Phase 10: Testing & Examples

### 10.1 Example DSL Files
- [x] Create `examples/static-no-enhance.dsl.ts` (tanpa enhancements)
- [x] Create `examples/static-with-enhance.dsl.ts` (dengan enhancements)
- [x] Test dengan minimal pages dan components

**Dependencies:** Phase 1-8  
**Estimated Time:** 1-2 hours

### 10.2 Golden Tests
- [x] Add golden test untuk `dist/index.html`
- [x] Add golden test untuk `dist/assets/style.css`
- [x] Add golden test untuk `dist/assets/app.js` (jika ada)
- [x] Verify "JS off still readable" (snapshot HTML structure)

**Dependencies:** 10.1  
**Estimated Time:** 2-3 hours

### 10.3 Manual Testing Checklist
- [ ] Test: buka HTML dari file system (tanpa server)
- [ ] Test: disable JS di browser → verify masih readable dan navigable
- [ ] Test: verify sidebar toggle works dengan JS enabled
- [ ] Test: verify copy code works
- [ ] Test: verify theme toggle works (jika enabled)
- [ ] Test: verify code highlighting works (jika enabled)
- [ ] Test: verify all links work
- [ ] Test: verify sitemap.xml accessible
- [ ] Test: verify robots.txt accessible

**Dependencies:** 10.1  
**Estimated Time:** 1-2 hours

### 10.4 Integration with irgen Docs
- [ ] Generate irgen docs website sebagai static-site
- [ ] Verify load cepat
- [ ] Verify navigasi sidebar jalan
- [ ] Verify code block enak dibaca + copy
- [ ] Verify JS off tetap terbaca

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
- Use `"static-site"` as target name (consistent dengan naming convention)
- Policy namespace: `staticSite` atau `static-site` (to be decided, prefer `staticSite` untuk consistency dengan camelCase)

### DSL Compatibility
- Static-site target shares FrontendIR dengan React target
- Components yang tidak compatible (complex forms, async select) perlu degradation strategy:
  - Show read-only version
  - Show link to alternative page
  - Or skip rendering dengan warning

### Capability-Based Dependencies
- **Critical**: Only emit JS/CSS/dependencies jika capability benar-benar digunakan
- Track capabilities di IR lowering stage
- Emitter checks capabilities sebelum emitting assets

### HTML-First Principle
- All content harus render sebagai valid HTML tanpa JS
- JS hanya untuk enhancement (UX improvements)
- Degrade gracefully jika JS disabled

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
3. ✅ Load cepat (no heavy runtime)
4. ✅ Navigasi sidebar jalan (with JS)
5. ✅ Code block enak dibaca + copy (with enhancement)
6. ✅ JS off tetap terbaca dan navigable
7. ✅ Golden tests pass
8. ✅ Manual testing checklist passed
