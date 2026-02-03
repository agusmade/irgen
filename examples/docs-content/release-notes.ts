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
      title: "Latest: v0.3.1 - The Hybrid App Platform",
      blocks: [
        {
          type: "paragraph",
          text: [
            "This release unifies the core and PHP extensions into a cohesive Hybrid App Platform.",
            "Introducing the Multi-DSL pattern, improved extension developer experience with namespaced logging, and dynamic multi-SPA routing.",
          ].join(" "),
        },
      ],
    },
    {
      type: "features",
      items: [
        { title: "Hybrid App Engine", description: "Deploy blogs and custom apps simultaneously.", icon: "Layers" },
        { title: "Split DSL", description: "Standardized pattern for logic and UI separation.", icon: "Scissors" },
        { title: "Extension DX", description: "Namespaced loggers, root context usage, and auto-namespacing.", icon: "Wrench" },
        { title: "Dynamic Routing", description: "Advanced multi-SPA .htaccess generation.", icon: "Shuffle" },
      ],
    },
    {
      type: "section",
      title: "v0.3.0 - Enterprise & Observability",
      blocks: [
        {
          type: "paragraph",
          text: [
            "This major update focuses on production readiness and developer experience.",
            "Introducing built-in logging, health checks, error boundaries, and three new powerful CLI commands.",
          ].join(" "),
        },
      ],
    },
    {
      type: "features",
      items: [
        { title: "irgen init", description: "Interactive project scaffolding.", icon: "Sparkles" },
        { title: "irgen check", description: "Semantic DSL integrity validator.", icon: "Search" },
        { title: "irgen studio", description: "Real-time visual dashboard.", icon: "Layout" },
        { title: "Logging & Health", description: "Pino and Prometheus integration.", icon: "Activity" },
      ],
    },
    {
      type: "section",
      title: "v0.2.2 - Universal Actions & Macros",
      blocks: [
        {
          type: "paragraph",
          text: [
            "This release introduces the Universal Action Model and a powerful Macro system,",
            "along with deep visual policy overrides and unified frontend authentication contracts.",
          ].join(" "),
        },
      ],
    },
    {
      type: "features",
      items: [
        { title: "Universal Actions", description: "Unified invoke/navigate behavior for all components.", icon: "MousePointer" },
        { title: "Macro System", description: "Expand TablePage, AuthPage, and EditorPage with one line.", icon: "Box" },
        { title: "Operation-Backed Forms", description: "Forms bind directly to operations with auto-loading.", icon: "ClipboardList" },
        { title: "Auth Contracts", description: "Deterministic login/logout and nav visibility logic.", icon: "Lock" },
      ],
    },
    {
      type: "section",
      title: "v0.2.0 - The General Purpose Release",
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
