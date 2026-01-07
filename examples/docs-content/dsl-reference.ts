import type { DocSection } from "./types.js";

export const dslReferenceSection: DocSection = {
  id: "dsl-reference",
  title: "DSL Reference",
  subtitle: "Minimal syntax for backend and frontend.",
  description: "Quick reference for the DSL entry points and core constructs.",
  content: [
    "irgen ships two DSL entry points: `app(...)` for backend and `frontend(...)`",
    "for web UI targets. Each DSL maps to its own DomainIR.",
  ].join(" "),
  code: {
    language: "typescript",
    snippet: [
      "import { app } from \"irgen\";",
      "",
      "app(\"DemoApp\", (a) => {",
      "  a.entity(\"User\", (e) => {",
      "    e.model({ id: \"string\", email: \"string\" });",
      "    e.create();",
      "    e.get();",
      "    e.list();",
      "  });",
      "});",
    ].join("\n"),
  },
  subsections: [
    {
      title: "Frontend DSL",
      content: [
        "Frontend DSL declares pages and components. Components can be plain or",
        "form-like; policies decide rendering and enhancements.",
      ].join(" "),
      code: {
        language: "typescript",
        snippet: [
          "import { frontend } from \"irgen\";",
          "",
          "frontend(\"DemoFrontend\", (f) => {",
          "  f.page(\"Home\", { path: \"/\" }, (p) => {",
          "    p.component(\"Hero\");",
          "  });",
          "  f.component(\"Hero\", (c) => {",
          "    c.content = \"Hello from irgen\";",
          "  });",
          "});",
        ].join("\n"),
      },
    },
    {
      title: "Policies in DSL",
      content: [
        "You can attach policy blocks directly in DSL options. Policies remain",
        "declarative and are resolved in lowering.",
      ].join(" "),
      code: {
        language: "typescript",
        snippet: [
          "frontend(\"Docs\", {",
          "  policies: {",
          "    staticSite: { enhancements: { enabled: true } }",
          "  }",
          "}, (f) => {",
          "  f.page(\"Home\", { path: \"/\" });",
          "});",
        ].join("\n"),
      },
    },
  ],
};
