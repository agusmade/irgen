import type { DocSection } from "./types.js";

export const backendSection: DocSection = {
  id: "backend",
  title: "Backend",
  subtitle: "API generation with explicit constraints.",
  description: "Backend output is policy-driven and stays deterministic.",
  content: [
    "Backend is a first-class target with its own policy block. Lowering decides",
    "framework, persistence, and security defaults, then emitters only render the",
    "resolved TargetIR.",
  ].join(" "),
  code: {
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
  subsections: [
    {
      title: "Target Scope",
      content: [
        "Backend output includes API, data modeling, and service wiring. It is not a",
        "subset of frontend or static-site output.",
      ].join(" "),
    },
    {
      title: "Policy-Driven Decisions",
      content: [
        "Policies choose providers, ID strategies, and auth defaults. Emitters never",
        "interpret policies directly.",
      ].join(" "),
    },
    {
      title: "Lowering Boundaries",
      content: [
        "Lowering resolves routing, validation, and persistence wiring into TargetIR",
        "so outputs stay deterministic.",
      ].join(" "),
    },
    {
      title: "Extensibility",
      content: [
        "Backend can be extended with new mappers, transforms, or emitters using the",
        "extension system without changing core targets.",
      ].join(" "),
    },
  ],
};
