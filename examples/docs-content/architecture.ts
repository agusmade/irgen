import type { DocSection } from "./types.js";

export const architectureSection: DocSection = {
  id: "architecture",
  title: "Architecture",
  subtitle: "Compiler-style, IR-first design.",
  description: "How irgen separates intent, decisions, and output across a compiler-like pipeline.",
  content: [
    {
      type: "paragraph",
      text: [
        "irgen mirrors compiler architecture: DSL captures intent, IR encodes structure,",
        "lowering resolves policy into TargetIR, and emitters serialize output.",
        "Each stage has clear responsibility and does not leak into others.",
      ].join(" "),
    },
    {
      type: "features",
      items: [
        {
          title: "Deterministic",
          description: "Same DSL plus policy produces the same output.",
          icon: "CheckCircle",
        },
        {
          title: "Policy-Driven",
          description: "All decisions happen in lowering, never in emitters.",
          icon: "ShieldCheck",
        },
        {
          title: "Multi-Target",
          description: "Backend, Frontend, Electron, and Static Site from one IR.",
          icon: "Layers",
        },
      ],
    },
    {
      type: "code",
      language: "mermaid",
      snippet: [
        "graph TD",
        "  DSL[DSL] --> Decl[DeclIR]",
        "  Decl --> Domain[DomainIR]",
        "  Domain --> Lowering[Lowering]",
        "  Lowering --> Target[TargetIR]",
        "  Target --> Emitter[Emitter]",
        "  Emitter --> Output[Generated Output]",
      ].join("\n"),
    },
    {
      type: "section",
      title: "What is irgen?",
      blocks: [
        {
          type: "paragraph",
          text: [
            "irgen is a compiler-style code generation framework built around an",
            "Intermediate Representation (IR). It translates intent to IR, then to",
            "TargetIR, and finally to emitted code.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Problems irgen Solves",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Modern projects often target backend, frontend, desktop, and static output,",
            "each with different dependencies and conventions. irgen centralizes intent",
            "into IR to reduce boilerplate and keep architecture consistent.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Compiler-Style Pipeline",
      blocks: [
        {
          type: "paragraph",
          text: [
            "DSL -> DeclIR -> DomainIR -> TargetIR -> Emitter -> Output. Each stage is",
            "well-defined and does not leak responsibilities into others.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "IR as Contract",
      blocks: [
        {
          type: "paragraph",
          text: [
            "IR represents intent, not implementation. Emitters never reinterpret policy or",
            "intent. This keeps output deterministic and easier to reason about.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Lowering as Decision Point",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Lowering reads policy, resolves constraints, and produces TargetIR that is",
            "already final. Emitters only execute.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Target Separation",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Backend and frontend targets remain independent. Enabling one does not",
            "implicitly enable the other.",
          ].join(" "),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See Policies", href: "/policies/" },
      ],
    },
  ],
};
