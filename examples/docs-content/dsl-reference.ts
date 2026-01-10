import type { DocSection } from "./types.js";

export const dslReferenceSection: DocSection = {
  id: "dsl-reference",
  title: "DSL Reference",
  subtitle: "Minimal syntax for backend and frontend.",
  description: "Quick reference for the DSL entry points and core constructs.",
  content: [
    {
      type: "paragraph",
      text: [
        "irgen ships two primary entry points: `app(...)` for backend and `frontend(...)`.",
        "Each DSL maps to its own DomainIR, allowing you to describe system intent",
        "independently of implementation details.",
      ].join(" "),
    },
    {
      type: "section",
      title: "Core Concepts",
      blocks: [
        {
          type: "paragraph",
          text: [
            "To keep the architecture modular, irgen distinguishes between the data layer",
            "and the interaction layer:",
          ].join(" "),
        },
        {
          type: "paragraph",
          text: [
            "• **Operation**: The atom of the backend contract. It defines a specific",
            "API call (path, method, payload) regardless of how the UI uses it.",
          ].join(" "),
        },
        {
          type: "paragraph",
          text: [
            "• **Action**: The representation of intent in the UI. It binds a component",
            "to an operation, handling state, loading, and optimistic updates.",
          ].join(" "),
        },
      ],
    },
    {
      type: "code",
      language: "typescript",
      snippet: [
        "import { app } from \"irgen\";",
        "",
        "app(\"DemoApp\", (a) => {",
        "  a.entity(\"User\", (e) => {",
        "    e.model({ id: \"string\", email: \"string\" });",
        "    e.create();",
        "    e.list();",
        "  });",
        "});",
      ].join("\n"),
    },
    {
      type: "section",
      title: "Common Frontend DSL",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Frontend DSL declares pages and components. Components can be plain or",
            "bound to operations; policies decide final rendering modes.",
          ].join(" "),
        },
        {
          type: "code",
          language: "typescript",
          snippet: [
            "import { frontend } from \"irgen\";",
            "",
            "frontend(\"DemoFE\", (f) => {",
            "  f.page(\"Home\", { path: \"/\" }, (p) => {",
            "    p.component(\"Hero\");",
            "  });",
            "  f.component(\"Hero\", (c) => {",
            "    c.content = \"Hello from irgen\";",
            "  });",
            "});",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Operation-Oriented DSL",
      blocks: [
        {
          type: "paragraph",
          text: [
            "The new frontend DSL supports an **Operation-Oriented** architecture with specialized",
            "constructs for connecting to any API.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Flexible Definitions",
      blocks: [
        {
          type: "paragraph",
          text: [
            "You can now define entities either directly in the options object",
            "or using standalone function calls within the callback.",
          ].join(" "),
        },
        {
          type: "code",
          language: "typescript",
          snippet: [
            "import { frontend, datasource } from \"irgen\";",
            "",
            "frontend(\"AdminApp\", {",
            "  datasources: [{ id: \"api\", baseUrl: \"/api\" }]",
            "}, (app) => {",
            "  // Standalone function call",
            "  datasource(\"legacy\", { baseUrl: \"https://old.api.com\" });",
            "",
            "  app.page(\"Dashboard\", ...);",
            "});",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Operation-Oriented UI",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Use `datasource`, `operation`, and `resource` to model your data layer.",
          ].join(" "),
        },
        {
          type: "code",
          language: "typescript",
          snippet: [
            "app.datasource(\"main\", { baseUrl: \"/api\", authStrategyId: \"bearer\" });",
            "",
            "app.operation(\"publish\", {",
            "  datasourceId: \"main\",",
            "  method: \"POST\",",
            "  path: \"/posts/:id/publish\"",
            "});",
            "",
            "app.resource(\"posts\", {",
            "  datasourceId: \"main\",",
            "  listOpId: \"list-posts\"",
            "});",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Component Helpers",
      blocks: [
        {
          type: "paragraph",
          text: [
            "New helpers like `table()` allow binding UI components directly to operations.",
          ].join(" "),
        },
        {
          type: "code",
          language: "typescript",
          snippet: [
            "app.component(\"PostTable\", (c) => {",
            "  c.table({",
            "    operationId: \"list-posts\",",
            "    columns: [",
            "      { header: \"Title\", accessor: \"title\" },",
            "      { header: \"Status\", accessor: \"status\" }",
            "    ]",
            "  });",
            "});",
          ].join("\n"),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See Frontend Docs", href: "/frontend/" },
        { label: "See Policies", href: "/policies/" },
      ],
    },
  ],
};
