import type { DocSection } from "./types.js";

export const contributingSection: DocSection = {
  id: "contributing",
  title: "Contributing",
  subtitle: "Mental model and guardrails.",
  description: "How to extend irgen without breaking architectural boundaries.",
  content: [
    {
      type: "paragraph",
      text: [
        "irgen prioritizes determinism, clear boundaries, and predictable output.",
        "Contributors must keep emitters dumb and place logic in the correct layer.",
      ].join(" "),
    },
    {
      type: "section",
      title: "Design Constraints",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Determinism is non-negotiable. Build-time decisions are preferred and runtime",
            "behavior must remain optional and non-authoritative.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Emitter Discipline",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Emitters only read TargetIR and write files. They must never read policy,",
            "infer intent, or decide features.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Explicit Non-Goals",
      blocks: [
        {
          type: "paragraph",
          text: [
            "irgen is not a framework, not a runtime platform, and not a template engine.",
            "It generates projects that use existing frameworks.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Trade-Offs",
      blocks: [
        {
          type: "paragraph",
          text: [
            "irgen avoids SSR runtime and implicit behavior to keep output deterministic",
            "and easy to audit. SSG provides most benefits with fewer costs.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Contributor Checklist",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Is this intent, constraint, or execution? Does it belong in DSL, policy,",
            "lowering, or emitter? Can it be decided deterministically?",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Common Pitfalls",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Avoid overloading the DSL or letting target concerns leak upward. Explicit",
            "beats clever.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Why irgen Exists",
      blocks: [
        {
          type: "paragraph",
          text: [
            "irgen favors clarity over magic, structure over templates, and decisions over",
            "guesses. It is built for developers who think in systems.",
          ].join(" "),
        },
      ],
    },
  ],
};
