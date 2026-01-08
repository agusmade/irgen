# Core Component Contract

This document defines the minimum shared component surface between the `frontend` (React) emitter and the `static-site` emitter. The goal is predictable parity: anything that renders in static-site should also render in frontend, while frontend remains free to support richer, interactive variants.

## Goals

- Provide a stable subset of component capabilities that all emitters must honor.
- Prevent “one-off” component behavior that drifts between targets.
- Keep static-site renderable without requiring React-only features.

## Core Component Surface (Required)

These fields should be supported by **both** emitters:

| Component Field | Meaning | Notes |
| --- | --- | --- |
| `content` | Plain text or lightweight Markdown content | Static-site and frontend both render Markdown. |
| `layout` (kind: `panel`, `row`, `column`, `tabs`) | Structural layout with optional `title` and `items` | Items are component names (by ID). |
| `codeBlock` | Code snippet with language | Static-site supports syntax highlight + copy; frontend renders styled code. |
| `marketing.kind = hero` | Hero section | Should render a prominent title/summary. |
| `marketing.kind = features` | Feature list | Each item: title/description/icon. |
| `marketing.kind = cta` | Call-to-action section | Actions array with labels/hrefs/variants. |
| `marketing.kind = stats` | Stats grid | Title/subtitle + stat items. |
| `marketing.kind = timeline` | Ordered steps | Title/subtitle + steps. |
| `marketing.kind = faq` | Q&A list | Title/subtitle + items. |
| `marketing.kind = testimonials` | Quotes | Title/subtitle + items. |
| `marketing.kind = logos` | Partner list | Title/subtitle + items. |
| `agentChat` | Chat transcript card | Title + messages (user/agent). |
| `cliUsage` | CLI usage panel | Title + command + options list. |

## Extended (Frontend-Only or Fallback)

These exist in IR but are **not** guaranteed in static-site:

| Component Field | Frontend (React) | Static-site |
| --- | --- | --- |
| `form` | Fully interactive form | Rendered as static placeholder (no inputs, no submit). |
| `themeToggle` | Interactive toggle | Rendered as static badge text. |
| `layout.tabs` | Interactive tabs | Rendered as stacked sections with labels (fallback). |
| `html` | Not allowed | Use `content` (Markdown) instead. |

## Safety Rules

- `content` is the only allowed rich text field and is rendered as Markdown across targets.
- `html` is **disallowed** and should not appear in DSL.

## Required Consistency

When adding a new component capability:

1. Decide if it belongs in the **core contract** or the **frontend-only** bucket.
2. If core: implement it in both emitters.
3. If frontend-only: document a static-site fallback behavior (even if minimal).

## Current Gaps (Known)

- Markdown is supported in both static-site and frontend.

## Recommendations

- Prefer `content` and core marketing blocks for shared docs.
- Avoid relying on `html` in shared docs unless the frontend is the only target.
- Treat `layout.tabs`, `form`, and `themeToggle` as progressive-enhancement features, not core.
