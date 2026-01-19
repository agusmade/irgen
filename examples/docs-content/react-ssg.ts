import type { DocSection } from "./types.js";

export const reactSsgSection: DocSection = {
  id: "react-ssg",
  title: "React SSG",
  subtitle: "Prerendered HTML with React authoring.",
  description: "SSG is a rendering mode of the React target, not a separate target.",
  content: [
    {
      type: "paragraph",
      text: [
        "React SSG renders HTML at build time and writes static files suitable for any",
        "static host. mode=\"ssg\" emits non-hydrated HTML, while mode=\"hybrid\" hydrates",
        "only when interactivity is required.",
      ].join(" "),
    },
    {
      type: "code",
      language: "mermaid",
      snippet: [
        "graph TD",
        "  Build[Vite Build] --> SSR[SSR Bundle]",
        "  SSR --> Pre[Prerender Step]",
        "  Pre --> HTML[Static HTML Files]",
      ].join("\n"),
    },
    {
      type: "section",
      title: "SSG as a Mode",
      blocks: [
        {
          type: "paragraph",
          text: [
            "SSG is a policy-controlled mode of the React target. It keeps the DSL unified",
            "and avoids separate react-ssg or react-ssr targets.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Policy Configuration",
      blocks: [
        {
          type: "code",
          language: "typescript",
          snippet: [
            "rendering: {",
            "  mode: \"ssg\",",
            "  prerender: {",
            "    routes: \"auto\",",
            "    emitSitemap: true,",
            "    emitRobotsTxt: true",
            "  }",
            "}",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Rendering Mode Resolution",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Lowering determines the prerender flow, route discovery strategy, and the",
            "metadata to inject. Emitters should not guess.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Route Discovery",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Static routes are prerendered. Dynamic routes are skipped with warnings",
            "unless explicitly provided.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Prerender Pipeline",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Build produces assets and manifest. SSR bundle renders each route. The",
            "prerender step writes static HTML and injects asset links.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Output Contract",
      blocks: [
        {
          type: "paragraph",
          text: [
            "HTML files are written to the root outDir with folder-style routing. The SPA",
            "fallback is preserved as index.spa.html.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Metadata Injection",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Metadata is resolved during lowering from page definitions and policy.",
            "Emitters inject final values into static HTML.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Asset Management",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Asset hashing and manifest-based injection provide stable caching.",
            "Static HTML links to the correct CSS and JS bundles.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Deployment",
      blocks: [
        {
          type: "paragraph",
          text: [
            "React SSG output is pure static files. It works on GitHub Pages, Netlify,",
            "and any static host without server runtimes.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Why Avoid SSR Runtime",
      blocks: [
        {
          type: "paragraph",
          text: [
            "SSR runtime introduces server dependencies and non-determinism. irgen favors",
            "build-time rendering for predictable artifacts.",
          ].join(" "),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See Policies", href: "/docs/policies/" },
      ],
    },
  ],
};
