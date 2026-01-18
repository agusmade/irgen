# Decisions

This file records core-level decisions that influence architecture or long-term direction.

## Visual Policy Vocabulary (Frontend UI)

**Status:** accepted  
**Date:** 2026-01-17

### Context

We need a way to change frontend appearance without editing core emitters. The IR should remain semantic (meaning-based), while appearance is a policy decision. Extensions and presets need a shared vocabulary for UI knobs without forcing core schema changes.

### Decision

Define a **visual policy vocabulary** in `docs/FRONTEND-VISUAL-CONTRACTS.md` and treat it as a best-effort contract under `policies.frontend.visual` (or `policies.ui`). Core must not validate or enforce these keys as IR schema. Emitters and runtimes may choose which knobs to honor.

### Rationale

- Keeps IR clean: IR expresses meaning, not taste.
- Enables experimentation and variation without core edits.
- Allows theme packs to become first-class ideas (admin, docs, marketing).

### Consequences

- Extensions can evolve UI behavior using policy keys.
- Emitters implement support incrementally, without schema changes.
- Some controls may be ignored by emitters that do not implement them.

### Minimum supported contracts (core emitters)

Core emitters should honor the following best-effort visual knobs:
- `visual.navLayout`: `topbar | sidebar | hybrid`
- `visual.contentWidth`: `full | wide | normal | narrow`
- `visual.density`: `compact | normal | spacious`
- `visual.topbarControls`: control visibility + avatar config (see `docs/FRONTEND-VISUAL-CONTRACTS.md`)
- `visual.brand`: control visibility of logos and logo source (topbar/sidebar)
- `visual.navItems`: override topbar/sidebar menus (separate lists)
- `visual.footerLinks`: replace or hide footer links
- `visual.footer`: enable/disable footer, set layout/text
- `visual.form`: override form-related classes
- `visual.button`: override base + variant classes
- `visual.table`: override table-related classes
- `visual.tabs`: override tabs-related classes
- `visual.marketing`: override marketing block classes
- `visual.cards`: override card/empty/placeholder classes
- `visual.prose`: override markdown/prose wrapper class
- `visual.search`: override search UI copy or disable
- `visual.docs`: override docs labels + toggle sidebar/TOC
- `visual.background`: toggle decorative gradients
- `visual.labels`: override common UI labels (e.g., sidebar label)
- `visual.motion`: override page enter + hover/alert/tag motion classes
- `visual.copy`: override empty/placeholder/table/tab strings + common UI labels
- `visual.tokens`: override typography/spacing/radius/shadow/color/motion tokens
- `visual.icons`: override default UI chrome icons
- `visual.breakpoints`: override responsive layout classes (padding/sidebar/topbar/docs grid/form/table + topbar wraps)
- `visual.agentChat`: define agent chat block classes + toggle
- `visual.cli`: define CLI usage block classes + toggle/layout
- `component.props.uiVariant`: `header | inline` (no card wrapper)
- `component.props.layoutVariant`: `header` (row layout becomes title + actions)

Emitters that do not support a key must ignore it gracefully.

### Rules of ownership

- IR expresses meaning (semantic structure).
- Visual appearance belongs to policy (`policies.frontend.visual`).
- Emitters interpret policy; they do not define UI taste.

### Upgrade path

- If a visual knob becomes stable across projects, it may be promoted to schema.
- If a knob proves unhelpful, it can be removed without core migrations.
