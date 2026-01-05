# 📘 irgen Documentation — Part 5

## Design Constraints, Non-Goals, and Contributor Mental Model

This final part explains **what irgen intentionally does *not* do**, the **trade-offs behind those decisions**, and the **mental model expected from contributors**.
These boundaries are as important as features—they are what keep irgen coherent over time.

---

## 30. Design Constraints

### 30.1 Determinism Is Non-Negotiable

irgen is designed so that:

* The same DSL + policy
* Always produces the same TargetIR
* And therefore the same output

This means:

* No hidden environment dependencies
* No runtime decisions during emission
* No “best effort” guessing in emitters

If something cannot be decided deterministically at build time, irgen prefers:

* explicit configuration,
* explicit skipping,
* or explicit warnings.

---

### 30.2 Build-Time First, Runtime Last

irgen strongly favors:

* build-time resolution
* static output
* inspectable artifacts

Runtime behavior is allowed **only when it is optional** and **non-authoritative** (e.g. progressive enhancement).

This constraint explains why irgen:

* supports SSG,
* supports static sites,
* avoids SSR runtimes,
* and avoids server-coupled features.

---

### 30.3 Emitters Must Stay Dumb

An emitter:

* reads TargetIR,
* serializes output,
* writes files.

An emitter must **never**:

* read policy directly,
* infer intent,
* decide features,
* or reinterpret structure.

If an emitter becomes “smart”, it is a design failure upstream.

---

## 31. Explicit Non-Goals

### 31.1 irgen Is Not a Framework

irgen is **not**:

* a web framework,
* a UI framework,
* a backend framework,
* or a runtime platform.

It does not replace:

* React
* Next.js
* Express
* Vite
* or any application framework

Instead, irgen **generates projects that use them**.

---

### 31.2 irgen Is Not a Template Engine

irgen intentionally avoids:

* string-based templating
* ad-hoc code substitution
* conditional snippets in emitters

All structure must pass through IR.

If something cannot be represented structurally, it likely does not belong in irgen.

---

### 31.3 irgen Is Not a Magic Tool

irgen does not attempt to:

* infer intent from vague input
* auto-optimize without rules
* “just make it work” silently

The philosophy is:

> **Explicit beats clever.**

When irgen cannot do something safely, it tells you.

---

## 32. Trade-Offs and Their Rationale

### 32.1 Why irgen Avoids SSR Runtime

SSR runtimes introduce:

* server dependencies
* environment coupling
* request-time complexity
* non-deterministic behavior

irgen avoids this because:

* static output is easier to reason about
* deployment is simpler
* long-term maintenance is safer

SSG provides most of the benefits of SSR with far fewer costs.

---

### 32.2 Why Some Features Are “Missing”

You may notice irgen does not include:

* automatic data fetching pipelines
* CMS integrations
* opinionated routing conventions
* implicit state management

These are not omissions—they are **intentional exclusions** to keep irgen:

* composable,
* auditable,
* and domain-agnostic.

---

### 32.3 Why Policies Are Not Schemas for Emitters

Policies describe **intent**, not output.

If emitters depended on policy schemas:

* every new policy would require emitter changes
* targets would become tightly coupled
* extension would become fragile

By isolating policy interpretation in lowering:

* new policies can be added safely
* emitters remain stable
* extensions remain feasible

---

## 33. Contributor Mental Model

### 33.1 How to Think When Working on irgen

When contributing to irgen, always ask:

1. Is this intent, constraint, or execution?
2. Does this belong in DSL, policy, lowering, or emitter?
3. Can this be decided deterministically?
4. Does this change reduce or increase coupling?

If the answer is unclear, the change likely needs refactoring.

---

### 33.2 Where to Put New Logic

* **New user intent** → DSL
* **New technical preference** → Policy
* **Decision logic** → Lowering
* **File generation** → Emitter

Never skip layers “for convenience”.

---

### 33.3 How to Extend irgen Safely

Safe extensions:

* add new TargetIR variants
* add new capabilities
* add new emitters
* add new policy blocks

Unsafe extensions:

* branching logic inside emitters
* policy reads inside emitters
* DSL constructs that leak implementation details

---

## 34. Common Pitfalls

### 34.1 Overloading the DSL

The DSL should not:

* encode framework specifics
* embed configuration logic
* mirror implementation details

If DSL starts to look like configuration, it is doing too much.

---

### 34.2 Letting Targets Leak Upward

Targets must not influence:

* DSL shape
* DomainIR
* DeclIR semantics

Once this happens, irgen loses its compiler-style separation.

---

### 34.3 Feature Pressure from Use Cases

As irgen grows, users may request:

* shortcuts
* automation
* implicit behavior

These requests should be evaluated against:

* determinism
* clarity
* architectural boundaries

Saying “no” is often the correct decision.

---

## 35. Why irgen Exists

irgen exists because:

* modern projects accumulate accidental complexity
* code generation tools often trade control for convenience
* long-lived systems need clear boundaries

irgen chooses:

* clarity over magic
* structure over templates
* decisions over guesses

It is built for developers who value **thinking in systems**.

---

## Final Status

👉 **Part 5 complete**
This concludes the core irgen documentation.

You now have:

* a complete architectural narrative
* a defensible design philosophy
* explicit boundaries and trade-offs
* a clear contributor mental model

