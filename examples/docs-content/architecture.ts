import type { DocSection } from "./types.js";

export const architectureSection: DocSection = {
  id: "architecture",
  title: "Architecture",
  subtitle: "Compiler-style, IR-first design.",
  description: "How irgen separates intent, decisions, and output across a compiler-like pipeline.",
  content: [
    "irgen mirrors compiler architecture: DSL captures intent, IR encodes structure,",
    "lowering resolves policy into TargetIR, and emitters serialize output.",
    "Each stage has clear responsibility and does not leak into others.",
  ].join(" "),
  features: [
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
  code: {
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
  subsections: [
    {
      title: "What is irgen?",
      content: [
        "irgen is a compiler-style code generation framework built around an",
        "Intermediate Representation (IR). It translates intent to IR, then to",
        "TargetIR, and finally to emitted code.",
      ].join(" "),
    },
    {
      title: "Problems irgen Solves",
      content: [
        "Modern projects often target backend, frontend, desktop, and static output,",
        "each with different dependencies and conventions. irgen centralizes intent",
        "into IR to reduce boilerplate and keep architecture consistent.",
      ].join(" "),
    },
    {
      title: "Compiler-Style Pipeline",
      content: [
        "DSL -> DeclIR -> DomainIR -> TargetIR -> Emitter -> Output. Each stage is",
        "well-defined and does not leak responsibilities into others.",
      ].join(" "),
    },
    {
      title: "IR as Contract",
      content: [
        "IR represents intent, not implementation. Emitters never reinterpret policy or",
        "intent. This keeps output deterministic and easier to reason about.",
      ].join(" "),
    },
    {
      title: "Lowering as Decision Point",
      content: [
        "Lowering reads policy, resolves constraints, and produces TargetIR that is",
        "already final. Emitters only execute.",
      ].join(" "),
    },
    {
      title: "Target Separation",
      content: [
        "Backend and frontend targets remain independent. Enabling one does not",
        "implicitly enable the other.",
      ].join(" "),
    },
  ],
};
