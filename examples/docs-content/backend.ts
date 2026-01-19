import type { DocSection } from "./types.js";

export const backendSection: DocSection = {
  id: "backend",
  title: "Backend",
  subtitle: "API generation with explicit constraints.",
  description: "Backend output is policy-driven and stays deterministic.",
  content: [
    {
      type: "paragraph",
      text: [
        "Backend is a first-class target with its own policy block. Lowering decides",
        "framework, persistence, and security defaults, then emitters only render the",
        "resolved TargetIR.",
      ].join(" "),
    },
    {
      type: "code",
      language: "typescript",
      snippet: [
        "policies: {",
        "  backend: {",
        "    core: { generateId: \"uuid_v4\" },",
        "    persistence: { provider: \"prisma\" },",
        "    auth: { mode: \"jwt\" }",
        "  }",
        "}",
      ].join("\n"),
    },
    {
      type: "section",
      title: "Target Scope",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Backend output includes API, data modeling, and service wiring. It is not a",
            "subset of frontend or static-site output.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Policy-Driven Decisions",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Policies choose providers, ID strategies, and auth defaults. Emitters never",
            "interpret policies directly.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Lowering Boundaries",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Lowering resolves routing, validation, and persistence wiring into TargetIR",
            "so outputs stay deterministic.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Extensibility",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Backend can be extended with new mappers, transforms, or emitters using the",
            "extension system without changing core targets.",
          ].join(" "),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See Policies", href: "/docs/policies/" },
        { label: "See Policy Reference", href: "/docs/policy-reference/" },
      ],
    },
  ],
};
