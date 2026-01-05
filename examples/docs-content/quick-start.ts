import type { DocSection } from "./types.js";

export const quickStartSection: DocSection = {
  id: "quick-start",
  title: "Quick Start",
  subtitle: "Get a working project in minutes.",
  hideHeader: true,
  description: "A short path to generate your first backend or frontend output using irgen.",
  content: [
    "irgen treats code generation like compilation. You describe intent in DSL,",
    "apply policies for target behavior, and run the CLI to emit code.",
    "Use the Architecture and Policies pages to understand the decision flow.",
  ].join(" "),
  hero: {
    badge: "Start Here",
    title: "Quick Start",
    subtitle: "Minimal steps to generate a real project.",
  },
  code: {
    language: "typescript",
    snippet: [
      "import { app, frontend } from \"irgen\";",
      "",
      "app(\"MyService\", (be) => {",
      "  be.entity(\"User\", (e) => {",
      "    e.field(\"email\", \"string\", { format: \"email\" });",
      "  });",
      "});",
      "",
      "frontend(\"AdminPanel\", (fe) => {",
      "  fe.page(\"Home\", { path: \"/\" }, (p) => {",
      "    p.component(\"UserList\");",
      "  });",
      "});",
    ].join("\n"),
  },
  subsections: [
    {
      title: "Generate Outputs",
      content: [
        "Run the CLI for the targets you need. Static-site and React SSG are",
        "policy-driven within the frontend target.",
      ].join(" "),
      code: {
        language: "bash",
        snippet: [
          "npx tsx src/cli.ts examples/app.dsl.ts --targets=backend,frontend",
          "npx tsx src/cli.ts examples/docs.dsl.ts --targets=static-site --outDir=generated/docs",
        ].join("\n"),
      },
    },
    {
      title: "Read Next",
      content: "Architecture -> Policies -> Frontend -> Static Site -> React SSG -> Contributing.",
    },
  ],
};
