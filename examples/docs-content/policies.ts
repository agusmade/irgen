import type { DocSection } from "./types.js";

export const policiesSection: DocSection = {
  id: "policies",
  title: "Policies",
  subtitle: "Intent, constraints, and preferences.",
  description: "Policies are declarative statements interpreted only during lowering.",
  content: [
    {
      type: "paragraph",
      text: [
        "A policy describes what kind of system you want, not how it is implemented.",
        "Emitters never read policy directly. Lowering interprets policy and produces",
        "a fully decided TargetIR.",
      ].join(" "),
    },
    {
      type: "code",
      language: "typescript",
      snippet: [
        "policies: {",
        "  backend: { core: { generateId: \"uuid_v4\" } },",
        "  frontend: {",
        "    framework: { rendering: { mode: \"ssg\", prerender: { routes: \"auto\" } } }",
        "  },",
        "  staticSite: { enabled: true, baseUrl: \"/docs/\" }",
        "}",
      ].join("\n"),
    },
    {
      type: "section",
      title: "What a Policy Is",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Policy is a declarative statement of intent. It does not emit code and is",
            "never interpreted by emitters.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Why Policy Exists",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Without policy separation, generators mix configuration into templates and",
            "emitters. irgen enforces DSL for intent, policy for constraints, lowering for",
            "decisions, and emitters for execution.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Policy Scope",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Policies are grouped by target domain, for example backend, frontend,",
            "staticSite, and electron. Each block is optional and composable.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Lowering Responsibilities",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Lowering resolves routing, capabilities, dependencies, and fallback behavior,",
            "then produces TargetIR that is final and deterministic.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Lowering Must Not Do",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Lowering must not emit files, generate code, perform IO, or depend on runtime",
            "behavior. It should be pure and deterministic.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Capability-Based Design",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Capabilities represent feature requirements such as search, copyCode, or",
            "themeToggle. Lowering detects capabilities and passes them to emitters.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Fallback Rules",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Unsupported constructs must degrade or be skipped with warnings. Silent failure",
            "is not allowed.",
          ].join(" "),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See Policy Reference", href: "/policy-reference/" },
      ],
    },
  ],
};
