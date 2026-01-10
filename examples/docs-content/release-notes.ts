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
      title: "Latest: v0.2.0 - The General Purpose Release",
      blocks: [
        {
          type: "paragraph",
          text: [
            "This release transforms irgen from a backend-specific generator into a",
            "full General-Purpose Webapp Generator.",
          ].join(" "),
        },
      ],
    },
    {
      type: "features",
      items: [
        { title: "Headless Runtime", description: "Backend-agnostic lib/runtime.ts for frontend apps.", icon: "Ghost" },
        { title: "Operation-Oriented", description: "DSL support for datasources, operations, and resources.", icon: "Activity" },
        { title: "React Integration", description: "Native useOperation and useResource hooks.", icon: "CheckCircle" },
        { title: "Multi-App Support", description: "Deploy multiple apps with the basePath policy.", icon: "Layers" },
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
