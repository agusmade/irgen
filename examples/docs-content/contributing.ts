import type { DocSection } from "./types.js";

export const contributingSection: DocSection = {
  id: "contributing",
  title: "Contributing",
  subtitle: "Mental model and guardrails.",
  description: "How to extend irgen without breaking architectural boundaries.",
  content: [
    "irgen prioritizes determinism, clear boundaries, and predictable output.",
    "Contributors must keep emitters dumb and place logic in the correct layer.",
  ].join(" "),
  subsections: [
    {
      title: "Design Constraints",
      content: [
        "Determinism is non-negotiable. Build-time decisions are preferred and runtime",
        "behavior must remain optional and non-authoritative.",
      ].join(" "),
    },
    {
      title: "Emitter Discipline",
      content: [
        "Emitters only read TargetIR and write files. They must never read policy,",
        "infer intent, or decide features.",
      ].join(" "),
    },
    {
      title: "Explicit Non-Goals",
      content: [
        "irgen is not a framework, not a runtime platform, and not a template engine.",
        "It generates projects that use existing frameworks.",
      ].join(" "),
    },
    {
      title: "Trade-Offs",
      content: [
        "irgen avoids SSR runtime and implicit behavior to keep output deterministic",
        "and easy to audit. SSG provides most benefits with fewer costs.",
      ].join(" "),
    },
    {
      title: "Contributor Checklist",
      content: [
        "Is this intent, constraint, or execution? Does it belong in DSL, policy,",
        "lowering, or emitter? Can it be decided deterministically?",
      ].join(" "),
    },
    {
      title: "Common Pitfalls",
      content: [
        "Avoid overloading the DSL or letting target concerns leak upward. Explicit",
        "beats clever.",
      ].join(" "),
    },
    {
      title: "Why irgen Exists",
      content: [
        "irgen favors clarity over magic, structure over templates, and decisions over",
        "guesses. It is built for developers who think in systems.",
      ].join(" "),
    },
  ],
};
