import type { DocSection } from "./types.js";

export const installCliSection: DocSection = {
  id: "install-cli",
  title: "Install & CLI",
  subtitle: "Get the CLI and run your first build.",
  description: "Installation and runtime requirements for the published CLI.",
  content: [
    {
      type: "paragraph",
      text: [
        "Install the CLI from npm and run it directly. irgen requires Node.js >= 18",
        "because it registers the tsx loader to execute .dsl.ts and its imports.",
      ].join(" "),
    },
    {
      type: "code",
      language: "bash",
      snippet: [
        "npm install -g irgen",
        "irgen --version",
        "irgen examples/app.dsl.ts --targets=backend",
      ].join("\n"),
    },
    {
      type: "section",
      title: "Local vs Global",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Global install is convenient for CLI usage. You can also use npx if you prefer",
            "not to install globally.",
          ].join(" "),
        },
        {
          type: "code",
          language: "bash",
          snippet: "npx irgen examples/app.dsl.ts --targets=backend",
        },
      ],
    },
    {
      type: "section",
      title: "TypeScript DSL Support",
      blocks: [
        {
          type: "paragraph",
          text: [
            "The CLI registers the tsx loader, so .dsl.ts can import other .ts modules",
            "without extra tooling.",
          ].join(" "),
        },
      ],
    },
  ],
};
