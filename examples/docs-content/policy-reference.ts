import type { DocSection } from "./types.js";

export const policyReferenceSection: DocSection = {
  id: "policy-reference",
  title: "Policy Reference",
  subtitle: "Quick knobs per target.",
  description: "A condensed map of policy blocks. See Policies for rationale.",
  content: [
    {
      type: "paragraph",
      text: [
        "Policies are grouped by target. This page lists common keys so you can find",
        "the right block quickly.",
      ].join(" "),
    },
    {
      type: "section",
      title: "Backend",
      blocks: [
        {
          type: "paragraph",
          text: [
            "backend.core, backend.auth, backend.logging, backend.health, backend.interfaces, backend.pagination, backend.envelope.",
          ].join(" "),
        },
        {
          type: "code",
          language: "typescript",
          snippet: [
            "policies: {",
            "  backend: {",
            "    core: { generateId: \"uuid_v4\" },",
            "    auth: { jwt: { enabled: true, secret: \"...\" } },",
            "    logging: { enabled: true, level: \"info\" },",
            "    health: { enabled: true, metrics: { enabled: true } },",
            "    interfaces: { rest: { basePath: \"/api\" } },",
            "    pagination: { type: \"page_limit\", defaults: { limit: 20 } },",
            "    envelope: { type: \"standard_v1\", keys: { data: \"data\" } }",
            "  }",
            "}",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Frontend",
      blocks: [
        {
          type: "paragraph",
          text: [
            "frontend.framework, frontend.auth, frontend.errorBoundary, frontend.visual, frontend.styling, frontend.build.",
          ].join(" "),
        },
        {
          type: "code",
          language: "typescript",
          snippet: [
            "policies: {",
            "  frontend: {",
            "    framework: { rendering: { mode: \"csr\", basePath: \"/\" } },",
            "    auth: { enabled: true, loginPath: \"/login\" },",
            "    errorBoundary: { enabled: true, fallback: \"detailed\" },",
            "    styling: { themePack: \"admin\", theme: { primaryColor: \"#0ea5e9\" } },",
            "    visual: { navLayout: \"sidebar\", contentWidth: \"wide\" },",
            "    build: { copyTo: { enabled: true, targetRoot: \"...\" } }",
            "  }",
            "}",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Static Site",
      blocks: [
        {
          type: "paragraph",
          text: [
            "staticSite.enhancements, staticSite.search, staticSite.codeHighlight,",
            "staticSite.assets, staticSite.seo, staticSite.theme, staticSite.navbar.",
          ].join(" "),
        },
        {
          type: "code",
          language: "typescript",
          snippet: [
            "policies: {",
            "  staticSite: {",
            "    enhancements: { enabled: true, features: [\"search\"] },",
            "    codeHighlight: { mode: \"pre\" }",
            "  }",
            "}",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Electron",
      blocks: [
        {
          type: "paragraph",
          text: [
            "electron.security, electron.loading, electron.packaging, electron.autoUpdate,",
            "electron.reliability.",
          ].join(" "),
        },
        {
          type: "code",
          language: "typescript",
          snippet: [
            "policies: {",
            "  electron: {",
            "    security: { contextIsolation: true },",
            "    packaging: { tool: \"electron-builder\" }",
            "  }",
            "}",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "CLI",
      blocks: [
        {
          type: "paragraph",
          text: "cli has an empty policy schema today (no special knobs).",
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See Policies", href: "/docs/policies/" },
      ],
    },
  ],
};
