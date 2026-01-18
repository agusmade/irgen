# Frontend Visual Audit Checklist

Goal: minimize future core edits by extracting visual decisions into best-effort policy hooks.
Scope: frontend emitters + runtime template + base CSS.
Status: [x] done · [~] partial · [ ] missing

## A) App chrome (frontend-react)
- [~] Navbar/Topbar layout classes are policy-driven (`visual.navLayout`, `visual.topbarControls`, `visual.brand`, `visual.navItems`) — layout mode supported, but class overrides are still mostly fixed.
- [~] Sidebar layout classes are policy-driven (`visual.navLayout`, `visual.brand`, `visual.navItems`, `visual.labels`) — structure toggles exist, but classes are fixed.
- [x] Topbar right controls are policy-driven (visibility, order, custom items, avatar).
- [x] Footer layout/link text is policy-driven (`visual.footer`, `visual.footerLinks`).
- [x] Search modal copy + empty-state text is policy-driven (`visual.search`).
- [x] Decorative backgrounds are policy-driven (`visual.background`).
- [x] Docs shell labels/toggles are policy-driven (`visual.docs`).
- [~] Default icons are replaceable or hideable (logo, avatar, nav icons) — UI chrome icons are policy-driven, but icon set is fixed.
- [~] Responsive breakpoints are policy-configurable (padding, width, stack rules) — padding + docs grid + sidebar width/visibility + topbar height/links/controls + form/table wrappers supported.

## B) Content framing (frontend-components)
- [x] Card wrapper classes are policy-driven (`visual.cards`).
- [~] Empty/placeholder states are policy-driven (`visual.cards`, `visual.copy`) — classes are policy-driven; copy text is still fixed.
- [x] Prose typography wrapper is policy-driven (`visual.prose`).
- [x] Form classes are policy-driven (`visual.form`).
- [x] Button classes are policy-driven (`visual.button`).
- [x] Table layout/action classes are policy-driven (`visual.table`).
- [x] Tabs layout classes are policy-driven (`visual.tabs`).
- [x] Marketing blocks are policy-driven (`visual.marketing`).
- [x] Agent chat block has policy hooks (`visual.agentChat`).
- [x] CLI usage block has policy hooks (`visual.cli`).
- [~] Motion/animation classes are policy-driven (`visual.motion`) — page enter + hover/alert/tag covered, others still fixed.
- [~] Copy/label strings are policy-driven (`visual.copy` or `visual.labels`) — partial (key empty states + nav/docs labels).

## C) Runtime template (runtime-template / runtime-emitter)
- [x] Route-level basePath handling does not hardcode UI.
- [x] Redirect/click behaviors can be configured without layout edits.
- [~] Any UI text inside runtime templates is policy-driven — error/exception strings now configurable.

## D) Base CSS (index.css / template CSS)
- [~] Typography scale (headings/body) is policy-driven or tokenized — prose only via `visual.tokens`.
- [~] Spacing scale (gap/padding) is policy-driven or tokenized — prose + cards/forms/tables/tabs/marketing/app chrome/docs sidebar+toc use CSS vars.
- [~] Radius/shadow tokens are policy-driven or tokenized — prose + cards/tables/buttons use CSS vars.
- [~] Color tokens are policy-driven (beyond primary) — prose + card/table/form + app chrome surfaces + muted text use CSS vars.
- [~] Motion tokens (duration/easing) are policy-driven — applied to root transitions.

## E) Schema/IR alignment (docs + IR)
- [x] Each policy hook has a documented key in `FRONTEND-VISUAL-CONTRACTS.md`.
- [x] `FRONTEND-POLICY.md` lists supported hooks.
- [x] `DECISIONS.md` records the contract additions.
- [x] `CHANGELOG.md` records new hooks.

## F) Extension safety checks
- [~] Existing DSLs render without changes (best-effort defaults) — not re-validated this pass.
- [x] Any new visual hook is optional and ignores unknown keys.

## Suggested next extractions
1. `visual.motion` for animation class overrides and disable toggle.
2. `visual.copy` for empty states + common UI text.
3. `visual.tokens` for typography/spacing/radius/shadow.
4. `visual.icons` for default icons (logo/avatar/search/bell).
5. `visual.breakpoints` for responsive layout rules.
