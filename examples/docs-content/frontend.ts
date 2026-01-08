import type { DocSection } from "./types.js";

export const frontendSection: DocSection = {
  id: "frontend",
  title: "Frontend",
  subtitle: "One DSL, multiple rendering modes.",
  description: "Frontend output is policy-driven without fragmenting the DSL.",
  content: [
    {
      type: "paragraph",
      text: [
        "irgen keeps a single frontend DSL. Rendering mode is chosen by policy during",
        "lowering, allowing CSR, SSG, or hybrid output without changing DSL structure.",
      ].join(" "),
    },
    {
      type: "features",
      items: [
        { title: "CSR", description: "Client-side React for dashboards and tools.", icon: "Cpu" },
        { title: "SSG", description: "Build-time HTML for SEO and static hosting.", icon: "Layers" },
        { title: "Static Site", description: "HTML-first output with optional enhancement.", icon: "Library" },
      ],
    },
    {
      type: "code",
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
    {
      type: "section",
      title: "DSL Entry Points",
      blocks: [
        {
          type: "paragraph",
          text: [
            "irgen separates DSL by domain, not technology. Use app(...) for backend",
            "and frontend(...) for UI and desktop targets.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Target-Agnostic DSL",
      blocks: [
        {
          type: "paragraph",
          text: [
            "The DSL declares what the UI is, not how it is rendered. Lowering decides",
            "CSR, SSG, or other modes based on policy.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "CSR",
      blocks: [
        {
          type: "paragraph",
          text: [
            "CSR renders entirely in the browser. Initial HTML is a shell and JS is required",
            "for meaningful output.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "SSG",
      blocks: [
        {
          type: "paragraph",
          text: [
            "SSG renders at build time to produce static HTML. mode=\"ssg\" ships non-hydrated",
            "pages, while mode=\"hybrid\" hydrates only when interactivity is required.",
          ].join(" "),
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
            "Static Site is a separate target that produces HTML-first output with optional",
            "progressive enhancement and no React runtime. It has its own staticSite",
            "policy block, separate from frontend.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "PWA",
      blocks: [
        {
          type: "paragraph",
          text: [
            "PWA settings belong to the frontend target. They configure manifests and",
            "installability for web outputs without changing the DSL.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Electron vs Frontend",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Electron is a separate target with its own policy block. Frontend focuses",
            "on web outputs; Electron has distinct security and packaging concerns.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Combining Targets",
      blocks: [
        {
          type: "paragraph",
          text: [
            "A common pattern is React SSG for marketing pages and Static Site for docs.",
            "Both outputs can be merged into a single dist directory for static hosting.",
          ].join(" "),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See Policies", href: "/policies/" },
        { label: "See React SSG", href: "/react-ssg/" },
      ],
    },
  ],
};
