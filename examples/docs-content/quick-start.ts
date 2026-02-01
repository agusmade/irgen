import type { DocSection } from "./types.js";

export const quickStartSection: DocSection = {
  id: "quick-start",
  title: "Quick Start",
  subtitle: "Get a working project in minutes.",
  hideHeader: true,
  description: "Two short paths: connect to an existing API, or generate a full-stack starter.",
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
        "irgen can generate frontend apps, backend targets, or both.",
        "These can share the same contracts, or run independently and integrate with existing frontend and/or backend systems.",
        "It treats code generation like compilation: you describe intent in DSL, apply policies for target behavior, and emit code.",
      ].join(" "),
    },
    {
      type: "features",
      items: [
        { title: "Compiler-Style IR", description: "Transform descriptions through explicit IR stages for multi-target consistency.", icon: "Cpu" },
        { title: "Policy-Driven", description: "Control architectural rules and emitter behavior globally via policies.", icon: "Shield" },
        { title: "Operation-Oriented", description: "Define contracts once and bind UI/Backend to them consistently.", icon: "Activity" },
      ],
    },
    {
      type: "section",
      title: "Core Concept: Operation vs Action",
      blocks: [
        {
          type: "paragraph",
          text: [
            "An **Operation** is a backend contract: a request (query or command) with a defined input and output.",
            "An **Action** is how an operation is triggered in the UI (button click, form submit, row action, etc.).",
            "Operation is the architectural atom; Action is a UI concern. CRUD is just a common pattern of operations, not a requirement.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Path A: Operation-First (Existing API)",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Use this path if your backend already exists (internal API, SaaS, PHP shared hosting, etc.).",
            "irgen generates a headless runtime and React components bound to your API contracts.",
          ].join(" "),
        },
        {
          type: "code",
          language: "typescript",
          snippet: [
            'import { frontend } from "irgen";',
            "",
            'frontend("AdminApp", (app) => {',
            '  // 1) Define where requests go',
            '  app.datasource("api", { baseUrl: "https://api.example.com" });',
            "",
            '  // 2) Define the contract (Operation)',
            '  app.operation("listUsers", { datasourceId: "api", method: "GET", path: "/users" });',
            '  app.operation("disableUser", { datasourceId: "api", method: "POST", path: "/users/:id/disable" });',
            "",
            '  // 3) Bind UI to operations',
            '  app.page("Users", (p) => {',
            '    p.component("UserTable", (c) => {',
            '      c.table({ operationId: "listUsers" });',
            '      c.action({ label: "Disable", operationId: "disableUser" });',
            '    });',
            '  });',
            '});',
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Path B: Full-Stack (New Backend)",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Use this path if you want irgen to generate both backend and frontend.",
            "irgen provides higher-level DSL constructs (like entities/resources) that expand into underlying operations.",
          ].join(" "),
        },
        {
          type: "code",
          language: "typescript",
          snippet: [
            'import { app, frontend } from "irgen";',
            "",
            '// 1) Describe the backend target',
            'app("MyService", (be) => {',
            '  be.entity("Profile", (e) => {',
            '    e.model({ name: "string" });',
            '    e.list(); // sugar: expands into operations (list/get/create/update/delete as needed)',
            '  });',
            '});',
            "",
            '// 2) Describe the frontend (binds to operations)',
            'frontend("AdminPanel", (fe) => {',
            '  fe.page("Home", (p) => {',
            '    p.component("ProfileList");',
            '  });',
            '});',
          ].join("\n"),
        },
        {
          type: "paragraph",
          text: [
            "The important part: even if you start from a high-level CRUD abstraction, irgen still lowers it into Operations.",
            "That keeps the architecture consistent across both paths.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Generate Outputs",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Run the CLI for the targets you need.",
            "New in v0.3.0: use `irgen init` for scaffolding, `irgen check` for semantic validation, and `irgen studio` for real-time visualization.",
          ].join(" "),
        },
        {
          type: "code",
          language: "bash",
          snippet: [
            "# Core generation:",
            "irgen examples/app.dsl.ts --targets=backend,frontend",
            "",
            "# Specialized v0.3.0 commands:",
            "irgen init my-project",
            "irgen check examples/app.dsl.ts",
            "irgen studio examples/app.dsl.ts",
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
            "Use the published CLI for reproducible builds.",
            "The CLI uses the tsx loader to run .dsl.ts files (including imported .ts modules) without extra setup.",
          ].join(" "),
        },
        {
          type: "code",
          language: "bash",
          snippet: ["npm install -g irgen", "irgen --version"].join("\n"),
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
