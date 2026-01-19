import type { DocSection } from "./types.js";

export const electronSection: DocSection = {
  id: "electron",
  title: "Electron",
  subtitle: "Desktop output with strict security defaults.",
  description: "Electron is a dedicated target with policy-driven safeguards.",
  content: [
    {
      type: "paragraph",
      text: [
        "Electron output is a separate target. It is policy-driven and hardened by",
        "default so emitters can stay deterministic and predictable.",
      ].join(" "),
    },
    {
      type: "code",
      language: "typescript",
      snippet: [
        "policies: {",
        "  electron: {",
        "    security: {",
        "      contextIsolation: true,",
        "      nodeIntegration: false,",
        "      sandbox: true",
        "    },",
        "    loading: { devUrl: \"http://localhost:5173\" },",
        "    packaging: { tool: \"electron-builder\" }",
        "  }",
        "}",
      ].join("\n"),
    },
    {
      type: "section",
      title: "Target Scope",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Electron has its own policy block and TargetIR. It is not a variant of",
            "frontend or backend; it is a first-class target.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Security Baseline",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Default policies enforce secure browser settings, IPC allowlists, and",
            "navigation hardening. The goal is safety without hidden defaults.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Dev vs Prod Loading",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Dev loads a local dev server; prod loads a file:// URL. The switch is",
            "policy-driven and does not rely on ad-hoc logic in emitters.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Packaging and Updates",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Packaging settings and auto-update wiring are handled through policy.",
            "Emitters only render the resolved output.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Extensions for OS Features",
      blocks: [
        {
          type: "paragraph",
          text: [
            "OS integrations (tray, deeplink, notifications) are best provided via",
            "extensions so core stays stable.",
          ].join(" "),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See Policies", href: "/docs/policies/" },
        { label: "See Policy Reference", href: "/docs/policy-reference/" },
      ],
    },
  ],
};
