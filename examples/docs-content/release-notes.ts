import type { DocSection } from "./types.js";

export const releaseNotesSection: DocSection = {
  id: "release-notes",
  title: "Release Notes",
  subtitle: "Versioning and changes.",
  description: "Where to find updates and how to report issues.",
  content: [
    {
      type: "paragraph",
      text: [
        "Check the changelog for the latest updates and breaking changes. You can",
        "always verify the installed CLI version with `irgen --version`.",
      ].join(" "),
    },
    {
      type: "section",
      title: "Changelog",
      blocks: [
        {
          type: "paragraph",
          text: "See CHANGELOG.md in the repository for detailed release notes.",
        },
      ],
    },
    {
      type: "section",
      title: "Reporting Issues",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Report bugs with a minimal DSL reproduction and the CLI command used.",
            "Include target, policy, and any warnings printed during generation.",
          ].join(" "),
        },
      ],
    },
  ],
};
