import type { DocSection } from "./types.js";

export const frontendSection: DocSection = {
  id: "frontend",
  title: "Frontend",
  subtitle: "One DSL, multiple rendering modes.",
  description: "Frontend output is policy-driven without fragmenting the DSL.",
  content: [
    "irgen keeps a single frontend DSL. Rendering mode is chosen by policy during",
    "lowering, allowing CSR, SSG, or hybrid output without changing DSL structure.",
  ].join(" "),
  features: [
    { title: "CSR", description: "Client-side React for dashboards and tools.", icon: "Cpu" },
    { title: "SSG", description: "Build-time HTML for SEO and static hosting.", icon: "Layers" },
    { title: "Static Site", description: "HTML-first output with optional enhancement.", icon: "Library" },
  ],
  code: {
    language: "typescript",
    snippet: [
      "frontend: {",
      "  framework: {",
      "    rendering: {",
      "      mode: \"csr\" | \"ssg\" | \"hybrid\"",
      "    }",
      "  }",
      "}",
    ].join("\n"),
  },
  subsections: [
    {
      title: "DSL Entry Points",
      content: [
        "irgen separates DSL by domain, not technology. Use app(...) for backend",
        "and frontend(...) for UI and desktop targets.",
      ].join(" "),
    },
    {
      title: "Target-Agnostic DSL",
      content: [
        "The DSL declares what the UI is, not how it is rendered. Lowering decides",
        "CSR, SSG, or other modes based on policy.",
      ].join(" "),
    },
    {
      title: "CSR",
      content: [
        "CSR renders entirely in the browser. Initial HTML is a shell and JS is required",
        "for meaningful output.",
      ].join(" "),
    },
    {
      title: "SSG",
      content: [
        "SSG renders at build time to produce static HTML. React remains the authoring",
        "model and runtime behavior stays CSR.",
      ].join(" "),
    },
    {
      title: "Static Site",
      content: [
        "Static Site is a separate target that produces HTML-first output with optional",
        "progressive enhancement and no React runtime.",
      ].join(" "),
    },
    {
      title: "Combining Targets",
      content: [
        "A common pattern is React SSG for marketing pages and Static Site for docs.",
        "Both outputs can be merged into a single dist directory for static hosting.",
      ].join(" "),
    },
  ],
};
