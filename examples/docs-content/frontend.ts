import type { DocSection } from "./types.js";

export const frontendSection: DocSection = {
  id: "frontend",
  title: "Frontend",
  subtitle: "General-Purpose Webapp Generator.",
  description: "Frontend output is backend-agnostic, operation-oriented, and policy-driven.",
  content: [
    {
      type: "paragraph",
      text: [
        "irgen generates full-stack web applications that are decoupled from specific backends.",
        "Using a headless runtime model, your frontend can interact with any API through",
        "standardized operations and data sources. This single DSL can then be rendered",
        "in multiple modes: CSR, SSG, or Hybrid.",
      ].join(" "),
    },
    {
      type: "features",
      items: [
        { title: "Universal Actions", description: "Unified invoke/navigate behavior for all UI components.", icon: "MousePointer" },
        { title: "Macro System", description: "High-level page templates like TablePage and AuthPage.", icon: "Box" },
        { title: "Operation-Backed Forms", description: "Forms bind directly to operations with auto-loading.", icon: "ClipboardList" },
        { title: "Auth Contracts", description: "Deterministic login/logout and nav visibility logic.", icon: "Lock" },
        { title: "Error Boundaries", description: "New in v0.3.0: Policy-driven reliability contracts.", icon: "Shield" },
      ],
    },
    {
      type: "section",
      title: "Universal Action Model",
      blocks: [
        {
          type: "paragraph",
          text: [
            "v0.2.2 introduces a unified way to handle interactions. Every component can now",
            "trigger an **Action**, which is either an `invoke` (triggering an operation) or",
            "a `navigate` (moving to a URL). This removes the need for custom event handlers",
            "for common tasks.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Macro System (Micro-Frontend Templates)",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Macros allow you to define complex page patterns with a single line of DSL.",
            "Built-in macros like `TablePage`, `AuthPage`, and `EditorPage` expand into",
            "standard components, giving you high-level abstractions without losing",
            "the flexibility of the underlying IR.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Operation-Oriented Architecture",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Traditional generators are often tied to a single REST resource model.",
            "irgen treats **Operations** as first-class citizens. Whether it is",
            "publishing a post, processing a payment, or triggering a build,",
            "every interaction is defined as a discrete operation bound to a DataSource.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Headless Client Runtime",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Every generated frontend includes a powerful `lib/runtime.ts`. This",
            "runtime manages the execution loop, authentication, and response normalization.",
            "Develop using standard React hooks: `useOperation(id)` for triggering actions",
            "and `useResource(id)` for managing entity state.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Client-Side Rendering (CSR)",
      blocks: [
        {
          type: "paragraph",
          text: [
            "CSR renders entirely in the browser. Initial HTML is a shell and JS is required",
            "for meaningful output. This is the default for dynamic dashboards where",
            "interactivity is the priority.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Static Site Generation (SSG)",
      blocks: [
        {
          type: "paragraph",
          text: [
            "SSG renders at build time to produce static HTML. mode=\"ssg\" ships non-hydrated",
            "pages for maximum speed, while mode=\"hybrid\" hydrates (adds interactivity)",
            "only when necessary. This is perfect for SEO-focused websites.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Progressive Web App (PWA)",
      blocks: [
        {
          type: "paragraph",
          text: [
            "PWA settings (manifest, icons, service workers) belong to the frontend target.",
            "They configure installability and offline capabilities for web outputs",
            "regardless of the rendering mode chosen.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Reliability (Error Boundaries)",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Use the `errorBoundary` policy to automatically wrap your application in a",
            "robust React Error Boundary. This ensures that runtime failures don't crash",
            "the entire app and provide clean feedback to the user.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Support for Multi-App",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Using the `basePath` policy, you can generate and deploy multiple applications",
            "(e.g., a Marketing Site at `/` and an Admin Portal at `/admin`) within the",
            "same project structure, sharing the same operation definitions.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Static Site Target vs React SSG",
      blocks: [
        {
          type: "paragraph",
          text: [
            "**Static Site** is a separate specialized target that produces HTML-first output",
            "with zero React dependency, ideal for documentation. **React SSG** is a",
            "rendering mode for the Frontend target that keeps the React ecosystem but",
            "pre-renders the initial state.",
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
            "Electron is a separate target with its own policy block. While they share",
            "the same UI DSL, Electron targets focus on desktop integration, local security,",
            "and native packaging concerns.",
          ].join(" "),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See DSL Reference", href: "/docs/dsl-reference/" },
        { label: "See Policies", href: "/docs/policies/" },
        { label: "See React SSG Detail", href: "/docs/react-ssg/" },
      ],
    },
  ],
};
