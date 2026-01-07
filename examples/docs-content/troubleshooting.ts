import type { DocSection } from "./types.js";

export const troubleshootingSection: DocSection = {
  id: "troubleshooting",
  title: "Troubleshooting",
  subtitle: "Common errors and fixes.",
  description: "Quick fixes for typical CLI and generation errors.",
  content: [
    "If generation fails, start by checking the CLI output and warnings.",
    "irgen always surfaces unsupported behavior as explicit warnings.",
  ].join(" "),
  subsections: [
    {
      title: "DSL entry did not call app(...) / frontend(...)",
      content: [
        "Make sure your DSL file imports the correct helper and calls it at top level.",
        "The CLI skips files that do not emit a declaration.",
      ].join(" "),
    },
    {
      title: "Cannot import .ts files",
      content: [
        "irgen requires Node >= 18 and uses the tsx loader. If you still see import",
        "errors, verify you are running the published CLI (`npx irgen`).",
      ].join(" "),
    },
    {
      title: "Policy validation failed",
      content: [
        "Policy schemas are strict. Double-check keys and value types in your policy",
        "blocks or JSON passed to `--policies`.",
      ].join(" "),
    },
    {
      title: "Dynamic routes skipped (static outputs)",
      content: [
        "Static Site and React SSG skip dynamic routes unless routes are explicit.",
        "Provide a static route list when required.",
      ].join(" "),
    },
    {
      title: "Missing assets (search, mermaid, highlight)",
      content: [
        "Warnings indicate optional assets are missing. Run `npm install` in the",
        "irgen project or disable the feature via policy.",
      ].join(" "),
    },
  ],
};
