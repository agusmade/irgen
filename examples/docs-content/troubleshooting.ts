import type { DocSection } from "./types.js";

export const troubleshootingSection: DocSection = {
  id: "troubleshooting",
  title: "Troubleshooting",
  subtitle: "Common errors and fixes.",
  description: "Quick fixes for typical CLI and generation errors.",
  content: [
    {
      type: "paragraph",
      text: [
        "If generation fails, start by checking the CLI output and warnings.",
        "irgen always surfaces unsupported behavior as explicit warnings.",
      ].join(" "),
    },
    {
      type: "section",
      title: "DSL entry did not call app(...) / frontend(...)",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Make sure your DSL file imports the correct helper and calls it at top level.",
            "The CLI skips files that do not emit a declaration.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Cannot import .ts files",
      blocks: [
        {
          type: "paragraph",
          text: [
            "irgen requires Node >= 18 and uses the tsx loader. If you still see import",
            "errors, verify you are running the published CLI (`npx irgen`).",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Policy validation failed",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Policy schemas are strict. Double-check keys and value types in your policy",
            "blocks or JSON passed to `--policies`.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Dynamic routes skipped (static outputs)",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Static Site and React SSG skip dynamic routes unless routes are explicit.",
            "Provide a static route list when required.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Missing assets (search, mermaid, highlight)",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Warnings indicate optional assets are missing. Run `npm install` in the",
            "irgen project or disable the feature via policy.",
          ].join(" "),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See CLI Reference", href: "/docs/cli-reference/" },
        { label: "See Policy Reference", href: "/docs/policy-reference/" },
      ],
    },
  ],
};
