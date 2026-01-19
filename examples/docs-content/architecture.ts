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
        "irgen can generate frontend apps, backend targets, or both. Each stage",
        "has clear responsibility and does not leak into others.",
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
        "  Target --> BE[Backend Emitter]",
        "  Target --> FE[Frontend Emitter]",
        "  Target --> SS[Static Site Emitter]",
        "  BE --> BE_OUT[Backend API]",
        "  FE --> FE_OUT[Frontend Webapp]",
        "  SS --> SS_OUT[Static Docs]",
        "  subgraph \"Target Example: Frontend\"",
        "    FE_OUT --> Runtime[Headless Runtime]",
        "    FE_OUT --> Components[UI Components]",
        "    Components -->|Hooks| Runtime",
        "  end",
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
            "Intermediate Representation (IR). It translates system intent to IR, then to",
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
            "into IR to reduce boilerplate and keep architecture consistent across all targets.",
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
            "irgen follows a rigorous pipeline: DSL -> DeclIR -> DomainIR -> TargetIR -> Emitter.",
            "This separation ensures that high-level intent is never mixed with target-specific",
            "implementation details or policy decisions.",
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
            "Intermediate Representation (IR) is the single source of truth. It represents",
            "intent, not implementation. Emitters never reinterpret policy; they simply",
            "serialize the deterministic TargetIR produced by the lowering stage.",
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
            "Backend and frontend targets remain strictly independent. Each has its own",
            "lowering rules and emitters. Enabling one does not implicitly affect the",
            "other, keeping the architecture modular and scalable.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Operation vs Action",
      blocks: [
        {
          type: "paragraph",
          text: [
            "For contributors and extension authors, the layer distinction is key:",
            "**Operation** is the backend-facing contract (Path, Method, Params).",
            "**Action** is the frontend-facing binding (Hooks, Loading State, Success/Error).",
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
            "already final. Parameters like database providers, rendering modes, or",
            "auth strategies are resolved here, keeping emitters pure and execution-only.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Target Capability: Operation-Oriented Frontend",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Within the Frontend target, irgen leverages an **Operation-Oriented**",
            "architecture. It treats interactions as discrete operations, allowing the",
            "generated UI to connect to any backend via a standardized Headless Runtime.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Headless Client Runtime",
      blocks: [
        {
          type: "paragraph",
          text: [
            "A core part of the generated **Frontend** target is the **Headless Runtime**.",
            "This auto-generated library (lib/runtime.ts) manages data fetching and",
            "authentication, serving as the bridge between declarative UI and external APIs.",
          ].join(" "),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See Frontend Docs", href: "/docs/frontend/" },
        { label: "See Policies", href: "/docs/policies/" },
      ],
    },
  ],
};
