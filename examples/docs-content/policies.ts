import type { DocSection } from "./types.js";

export const policiesSection: DocSection = {
  id: "policies",
  title: "Policies",
  subtitle: "Intent, constraints, and preferences.",
  description: "Policies are declarative statements interpreted only during lowering.",
  content: [
    "A policy describes what kind of system you want, not how it is implemented.",
    "Emitters never read policy directly. Lowering interprets policy and produces",
    "a fully decided TargetIR.",
  ].join(" "),
  code: {
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
  subsections: [
    {
      title: "What a Policy Is",
      content: [
        "Policy is a declarative statement of intent. It does not emit code and is",
        "never interpreted by emitters.",
      ].join(" "),
    },
    {
      title: "Why Policy Exists",
      content: [
        "Without policy separation, generators mix configuration into templates and",
        "emitters. irgen enforces DSL for intent, policy for constraints, lowering for",
        "decisions, and emitters for execution.",
      ].join(" "),
    },
    {
      title: "Policy Scope",
      content: [
        "Policies are grouped by target domain, for example backend, frontend,",
        "staticSite, and electron. Each block is optional and composable.",
      ].join(" "),
    },
    {
      title: "Lowering Responsibilities",
      content: [
        "Lowering resolves routing, capabilities, dependencies, and fallback behavior,",
        "then produces TargetIR that is final and deterministic.",
      ].join(" "),
    },
    {
      title: "Lowering Must Not Do",
      content: [
        "Lowering must not emit files, generate code, perform IO, or depend on runtime",
        "behavior. It should be pure and deterministic.",
      ].join(" "),
    },
    {
      title: "Capability-Based Design",
      content: [
        "Capabilities represent feature requirements such as search, copyCode, or",
        "themeToggle. Lowering detects capabilities and passes them to emitters.",
      ].join(" "),
    },
    {
      title: "Fallback Rules",
      content: [
        "Unsupported constructs must degrade or be skipped with warnings. Silent failure",
        "is not allowed.",
      ].join(" "),
    },
  ],
};
