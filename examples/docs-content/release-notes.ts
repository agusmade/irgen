import type { DocSection } from "./types.js";

export const releaseNotesSection: DocSection = {
  id: "release-notes",
  title: "Release Notes",
  subtitle: "Versioning and changes.",
  description: "Where to find updates and how to report issues.",
  content: [
    "Check the changelog for the latest updates and breaking changes. You can",
    "always verify the installed CLI version with `irgen --version`.",
  ].join(" "),
  subsections: [
    {
      title: "Changelog",
      content: "See CHANGELOG.md in the repository for detailed release notes.",
    },
    {
      title: "Reporting Issues",
      content: [
        "Report bugs with a minimal DSL reproduction and the CLI command used.",
        "Include target, policy, and any warnings printed during generation.",
      ].join(" "),
    },
  ],
};
