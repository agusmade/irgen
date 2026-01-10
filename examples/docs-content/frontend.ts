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
        { title: "Operation-Oriented", description: "Operations are the atom of the contract, not just CRUD.", icon: "Activity" },
        { title: "Headless Runtime", description: "Backend-agnostic lib/runtime.ts handles auth and data.", icon: "Ghost" },
        { title: "Any Rendering", description: "Choose CSR, SSG, or Hybrid without changing DSL.", icon: "Waves" },
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
        { label: "See DSL Reference", href: "/dsl-reference/" },
        { label: "See Policies", href: "/policies/" },
        { label: "See React SSG Detail", href: "/react-ssg/" },
      ],
    },
  ],
};
