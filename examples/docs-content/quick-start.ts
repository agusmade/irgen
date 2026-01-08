import type { DocSection } from "./types.js";

export const quickStartSection: DocSection = {
  id: "quick-start",
  title: "Quick Start",
  subtitle: "Get a working project in minutes.",
  hideHeader: true,
  description: "A short path to generate your first backend or frontend output using irgen.",
  content: [
    {
      type: "hero",
      badge: "Start Here",
      title: "Quick Start",
      subtitle: "Minimal steps to generate a real project.",
    },
    {
      type: "paragraph",
      text: [
        "irgen treats code generation like compilation. You describe intent in DSL,",
        "apply policies for target behavior, and run the CLI to emit code.",
        "Use the Architecture and Policies pages to understand the decision flow.",
      ].join(" "),
    },
    {
      type: "features",
      items: [
        { title: "Install", description: "Use the CLI from npm with Node.js >= 18.", icon: "Terminal" },
        { title: "Describe", description: "Write DSL for backend or frontend intent.", icon: "FileCode" },
        { title: "Generate", description: "Emit deterministic outputs per target.", icon: "Layers" },
      ],
    },
    {
      type: "code",
      language: "typescript",
      snippet: [
        'import { app, frontend } from "irgen";',
        "",
        'app("MyService", (be) => {',
        '  be.entity("User", (e) => {',
        '    e.field("email", "string", { format: "email" });',
        "  });",
        "});",
        "",
        'frontend("AdminPanel", (fe) => {',
        '  fe.page("Home", { path: "/" }, (p) => {',
        '    p.component("UserList");',
        "  });",
        "});",
      ].join("\n"),
    },
    {
      type: "section",
      title: "Generate Outputs",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Run the CLI for the targets you need. Static-site is a separate target,",
            "while React SSG is a rendering mode within the frontend target.",
          ].join(" "),
        },
        {
          type: "code",
          language: "bash",
          snippet: [
            "npx irgen examples/app.dsl.ts --targets=backend,frontend",
            "npx irgen examples/docs.dsl.ts --targets=static-site --outDir=generated/static-docs",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Install the CLI",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Use the published CLI for reproducible builds. The CLI uses the tsx loader",
            "to run .dsl.ts files (including imported .ts modules) without extra setup.",
          ].join(" "),
        },
        {
          type: "code",
          language: "bash",
          snippet: [
            "npm install -g irgen",
            "irgen --version",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Pick a Starting Path",
      blocks: [
        {
          type: "paragraph",
          text: [
            "If you want structure first, read Architecture and Policies. If you want",
            "hands-on output, start with Backend or Frontend. Documentation sites live",
            "under Static Site and React SSG.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Next Steps",
      blocks: [
        {
          type: "paragraph",
          text: [
            "If you want the mental model first, read Architecture and Policies.",
            "If you want to go target-by-target, start with Backend and Frontend.",
            "If you are here for documentation websites, jump to Static Site and React SSG.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Suggested Reading Order",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Install & CLI → CLI Reference → DSL Reference → Architecture → Policies →",
            "Policy Reference → Backend → Frontend → Static Site → React SSG → Electron →",
            "Extensions → Output Structure → Troubleshooting → Release Notes → Contributing.",
          ].join(" "),
        },
      ],
    },
  ],
};
