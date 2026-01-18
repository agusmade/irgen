# Frontend Visual Contracts (Policy Vocabulary)

This document defines a **shared vocabulary** for visual behavior. It is **not** an IR schema and should **not** be validated by core. Treat it as a *best-effort policy contract* so extensions/emitter runtimes can coordinate UI behavior without touching core.

Recommended home for these knobs:
- `policies.frontend.visual` (or `policies.ui`) as a loose, optional object.

## Minimum supported contracts (core emitters)
The following keys are considered the **minimum supported contracts** and should be honored by core emitters:
- `visual.navLayout`: `topbar | sidebar | hybrid`
- `visual.contentWidth`: `full | wide | normal | narrow`
- `visual.density`: `compact | normal | spacious`
- `component.props.uiVariant`: `header | inline` (no card wrapper)
- `component.props.layoutVariant`: `header` (row layout becomes title + actions)

If a key is unsupported by an emitter, it must be ignored gracefully.

## Implementation status (core emitters)
Legend: ✅ supported · ⚠️ partial · ⛔ ignored

- ✅ `visual.navLayout`
- ✅ `visual.contentWidth`
- ✅ `visual.density`
- ✅ `visual.topbarControls` (items, enabled, avatar, custom)
- ✅ `visual.brand` (topbar/sidebar logo visibility + override)
- ✅ `visual.navItems` (topbar/sidebar overrides + hideTopbar)
- ✅ `visual.footerLinks` (custom footer links or hide)
- ✅ `visual.footer` (enabled/layout/text)
- ✅ `visual.form` (label/input/error/form/button classes)
- ✅ `visual.button` (base + variant classes)
- ✅ `visual.table` (table layout + row/action classes)
- ✅ `visual.tabs` (tabs container/header/button/content classes)
- ✅ `visual.marketing` (per-block class overrides)
- ✅ `visual.cards` (card/empty/placeholder classes)
- ✅ `visual.prose` (markdown/prose wrapper class)
- ✅ `visual.search` (enabled + copy)
- ✅ `visual.docs` (docs labels + sidebar/TOC visibility)
- ✅ `visual.background` (decorative gradients)
- ✅ `visual.labels` (sidebar label override)
- ✅ `visual.motion` (page enter + hover/alert/tag motion classes)
- ✅ `visual.copy` (empty/placeholder/table/tab strings)
- ✅ `visual.tokens` (typography/spacing/radius/shadow tokens)
- ✅ `visual.icons` (default UI chrome icon overrides)
- ✅ `visual.breakpoints` (responsive layout class overrides)
- ✅ `component.props.uiVariant` (header/inline)
- ✅ `component.props.layoutVariant` (header)

## Audit checklist (hardcoded UI that should become policy)
Legend: ⛔ not policy · ⚠️ partial · ✅ policy

### App chrome (frontend-react)
- ⚠️ Sidebar header label ("Admin") and label text
- ⚠️ Default avatar URL (`i.pravatar.cc`)
- ⚠️ Footer links (Terms/Privacy/Contact)
- ⚠️ Footer layout + text
- ⚠️ Search modal copy + layout
- ⚠️ Docs sidebar headings ("Documentation", "On this page")
- ⚠️ Decorative background gradients (non-sidebar)

### Layout & density (frontend-components)
- ⚠️ Form styling (labels/inputs/errors)
- ⚠️ Table styling (row hover, separators, action buttons)
- ⚠️ Tabs styling + layout
- ⚠️ Button base styles
- ⚠️ Card/section wrappers + empty states
- ✅ Prose typography scale + spacing (prose wrapper class)

### Block presets
- ⚠️ Marketing blocks (hero/features/cta/etc)
- ⛔ Agent chat block
- ⛔ CLI usage block

## 1) Layout & chrome
- Page layout variant: `standard`, `header+content`, `split`, `sidebar`
- Navigation layout: `topbar`, `sidebar`, `hybrid`
- Content width: `full`, `wide`, `normal`, `narrow`
- Density: `compact`, `normal`, `spacious`

## 2) Header & toolbar
- Header composition: `title`, `subtitle`, `actions`
- Action placement: `left`, `right`, grouped primary/secondary
- Breadcrumbs / section label
- Sticky header toggle
- Topbar controls (right side): search, notifications, theme toggle, avatar
- Auth-aware visibility for topbar controls (e.g., hide avatar when not logged in)

### Proposed keys (best-effort)
- `visual.topbarControls.enabled`: boolean
- `visual.topbarControls.items`: array of
  - `search`
  - `notifications`
  - `themeToggle`
  - `avatar`
- `visual.topbarControls.avatar`: `{ src?: string, hideWhenAuthed?: boolean, hideWhenUnauthed?: boolean }`
- `visual.topbarControls.custom`: array of `{ label: string, href: string, icon?: string, target?: string }`
- `visual.brand`: `{ showTopbarLogo?: boolean, showSidebarLogo?: boolean, logoSrc?: string, logoText?: string, logoIcon?: string }`
- `visual.navItems`: `{ topbar?: Array<{ label: string, path: string }>, sidebar?: Array<{ label: string, path: string }>, hideTopbar?: boolean }`
- `visual.footerLinks`: array of `{ label: string, href: string }`
- `visual.footer`: `{ enabled?: boolean, layout?: "standard" | "compact", text?: string }`
- `visual.form`: `{ labelClass?: string, inputClass?: string, checkboxClass?: string, radioClass?: string, errorClass?: string, formClass?: string, buttonClass?: string }`
- `visual.button`: `{ baseClass?: string, primaryClass?: string, secondaryClass?: string, ghostClass?: string }`
- `visual.table`: `{ containerClass?: string, tableClass?: string, headClass?: string, headerCellClass?: string, bodyClass?: string, rowClass?: string, rowClickableClass?: string, cellClass?: string, actionsCellClass?: string, actionsWrapClass?: string, actionButtonClass?: string, emptyClass?: string, loadingClass?: string }`
- `visual.tabs`: `{ containerClass?: string, headerClass?: string, titleClass?: string, tabsWrapClass?: string, tabButtonClass?: string, tabActiveClass?: string, tabInactiveClass?: string, panelClass?: string, contentClass?: string, emptyClass?: string, noContentClass?: string }`
- `visual.marketing`: `{ hero?: {...}, features?: {...}, logos?: {...}, testimonials?: {...}, faq?: {...}, cta?: {...}, stats?: {...}, timeline?: {...} }`
- `visual.cards`: `{ containerClass?: string, headerClass?: string, bodyClass?: string, emptyClass?: string, placeholderClass?: string, gridEmptyClass?: string }`
- `visual.prose`: `{ className?: string }`
- `visual.motion`: `{ themeTransitionClass?: string, pageEnterClass?: string, docsEnterClass?: string, hoverLiftClass?: string, alertEnterClass?: string, tagEnterClass?: string }`
- `visual.copy`: `{ emptyPanel?: string, noItems?: string, emptyTab?: string, tableEmpty?: string, tableLoading?: string, tabsNoContent?: string, placeholderPrefix?: string, navSection?: string, docsSection?: string, footerDefault?: string, ipcButton?: string, terminalError?: string, terminalOutput?: string, runtimeText?: Record<string, string> }`
- `visual.tokens`: `{ typography?: { fontSans?: string, fontMono?: string, h1?: string, h2?: string, h3?: string, leading?: string }, spacing?: { xs?: string, sm?: string, md?: string, lg?: string, xl?: string }, radius?: { sm?: string, md?: string, lg?: string }, shadow?: { sm?: string, md?: string, lg?: string }, colors?: { text?: string, textDark?: string, muted?: string, mutedDark?: string, link?: string, linkDark?: string, codeBg?: string, codeBgDark?: string, preBg?: string, preText?: string, surface?: string, surfaceDark?: string }, motion?: { duration?: string, easing?: string } }`
- `visual.icons`: `{ logoFallback?: string, search?: string, notifications?: string, themeSun?: string, themeMoon?: string, paginationPrev?: string, paginationNext?: string, tagRemove?: string, docsSection?: string, docsItems?: Record<string, string>, navItems?: Record<string, string>, footerLinks?: Record<string, string>, searchInput?: string, searchEmpty?: string, rowActions?: Record<string, string> }`
- `visual.breakpoints`: `{ contentPadding?: string, docsPadding?: string, sidebarWidth?: string, sidebarOffsetClass?: string, sidebarResponsiveClass?: string, topbarHeightAdmin?: string, topbarHeightDefault?: string, topbarLinksWrapClass?: string, topbarControlsWrapClass?: string, formLayoutClass?: string, tableWrapperClass?: string, docsGrid?: { threeColumn?: string, twoColumn?: string, mainToc?: string, single?: string } }`
- `visual.search`: `{ enabled?: boolean, placeholder?: string, emptyMessage?: string }`
- `visual.docs`: `{ sidebarLabel?: string, tocLabel?: string, showSidebar?: boolean, showToc?: boolean }`
- `visual.background`: `{ showGradients?: boolean }`
- `visual.labels`: `{ sidebarLabel?: string }`
- `visual.agentChat`: `{ enabled?: boolean, containerClass?: string, headerClass?: string, bodyClass?: string, messageClass?: string, avatarClass?: string, inputClass?: string, actionsClass?: string, inputPlaceholder?: string }`
- `visual.cli`: `{ enabled?: boolean, containerClass?: string, commandClass?: string, outputClass?: string, badgeClass?: string, copyButtonClass?: string, layout?: "compact" | "full" }`

## 3) Component framing
- Container style: `card`, `flat`, `inline`
- Divider / section separator style
- Empty state style: `compact`, `informative`

## 4) Table & list presentation
- Row density, zebra/hover, separator style
- Row actions placement: inline right, kebab menu
- Bulk actions bar

## 5) Form presentation
- Form layout: single column, two column
- Field group styling: sections, panels
- Label + helper text positioning
- Submit bar placement: inline, sticky footer

## 6) Typography & spacing tokens
- Title scale mapping (H1..H3)
- Base spacing scale (xs/sm/md/lg)
- Border radius scale

## 7) Theme pack / preset
- Theme pack name: `admin`, `marketing`, `docs`, `dashboard`
- Surface styling per pack (background, card, border)

## 8) Feedback UI
- Toast style/position
- Inline validation styling
- Loading skeleton style

## Usage examples (best-effort)

### DSL
```ts
frontend("Admin", {
  policies: {
    frontend: {
      visual: {
        navLayout: "sidebar",
        contentWidth: "full",
        density: "compact",
        topbarControls: {
          custom: [
            { label: "GitHub", href: "https://github.com/agusmade/irgen", icon: "Github", target: "_blank" }
          ]
        },
        brand: {
          showTopbarLogo: true,
          showSidebarLogo: true,
          logoText: "irgen",
          logoIcon: "Box"
        },
        navItems: {
          topbar: [
            { label: "Home", path: "/" },
            { label: "Docs", path: "/docs" }
          ],
          sidebar: [
            { label: "Posts", path: "/" },
            { label: "New Post", path: "/posts/new" }
          ]
        }
      }
    }
  }
}, () => {});
```

### CLI
```bash
irgen --policies='{"frontend":{"visual":{"navLayout":"sidebar","contentWidth":"full","density":"compact","topbarControls":{"custom":[{"label":"GitHub","href":"https://github.com/agusmade/irgen","icon":"Github","target":"_blank"}]}}}}}'
```

### Hide controls (examples)
```ts
frontend("Admin", {
  policies: {
    frontend: {
      visual: {
        topbarControls: {
          enabled: true,
          items: ["search", "themeToggle"],
          avatar: { hideWhenUnauthed: true }
        }
      }
    }
  }
}, () => {});
```

## Preset examples

### Admin preset (dense + sidebar)
```ts
const adminVisual = {
  navLayout: "sidebar",
  contentWidth: "full",
  density: "compact",
  topbarControls: {
    items: ["search", "themeToggle", "avatar"],
    avatar: { hideWhenUnauthed: true }
  },
  brand: {
    showTopbarLogo: false,
    showSidebarLogo: true,
    logoText: "Admin",
    logoIcon: "Shield"
  },
  navItems: {
    topbar: [
      { label: "Docs", path: "/docs" }
    ],
    sidebar: [
      { label: "Posts", path: "/" },
      { label: "New Post", path: "/posts/new" }
    ]
  }
};
```

### Marketing preset (wide + topbar)
```ts
const marketingVisual = {
  navLayout: "topbar",
  contentWidth: "wide",
  density: "spacious",
  topbarControls: {
    items: ["search", "themeToggle"]
  },
  brand: {
    showTopbarLogo: true,
    showSidebarLogo: false,
    logoText: "irgen",
    logoIcon: "Sparkles"
  },
  marketing: {
    hero: {
      containerClass: "relative overflow-hidden rounded-3xl bg-slate-900 text-white p-12 md:p-20",
      titleClass: "text-4xl md:text-6xl font-black tracking-tight",
      subtitleClass: "text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed"
    },
    features: {
      gridClass: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6",
      cardClass: "p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
    }
  }
};
```
