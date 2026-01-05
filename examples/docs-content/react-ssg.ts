import type { DocSection } from "./types.js";

export const reactSsgSection: DocSection = {
  id: "react-ssg",
  title: "React SSG",
  subtitle: "Prerendered HTML with React authoring.",
  description: "SSG is a rendering mode of the React target, not a separate target.",
  content: [
    "React SSG renders HTML at build time while keeping CSR for runtime behavior.",
    "It avoids SSR runtime and produces static files suitable for any static host.",
  ].join(" "),
  code: {
    language: "mermaid",
    snippet: [
      "graph TD",
      "  Build[Vite Build] --> SSR[SSR Bundle]",
      "  SSR --> Pre[Prerender Step]",
      "  Pre --> HTML[Static HTML Files]",
    ].join("\n"),
  },
  subsections: [
    {
      title: "SSG as a Mode",
      content: [
        "SSG is a policy-controlled mode of the React target. It keeps the DSL unified",
        "and avoids separate react-ssg or react-ssr targets.",
      ].join(" "),
    },
    {
      title: "Policy Configuration",
      code: {
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
    },
    {
      title: "Rendering Mode Resolution",
      content: [
        "Lowering determines the prerender flow, route discovery strategy, and the",
        "metadata to inject. Emitters should not guess.",
      ].join(" "),
    },
    {
      title: "Route Discovery",
      content: [
        "Static routes are prerendered. Dynamic routes are skipped with warnings",
        "unless explicitly provided.",
      ].join(" "),
    },
    {
      title: "Prerender Pipeline",
      content: [
        "Build produces assets and manifest. SSR bundle renders each route. The",
        "prerender step writes static HTML and injects asset links.",
      ].join(" "),
    },
    {
      title: "Output Contract",
      content: [
        "HTML files are written to the root outDir with folder-style routing. The SPA",
        "fallback is preserved as index.spa.html.",
      ].join(" "),
    },
    {
      title: "Metadata Injection",
      content: [
        "Metadata is resolved during lowering from page definitions and policy.",
        "Emitters inject final values into static HTML.",
      ].join(" "),
    },
    {
      title: "Asset Management",
      content: [
        "Asset hashing and manifest-based injection provide stable caching.",
        "Static HTML links to the correct CSS and JS bundles.",
      ].join(" "),
    },
    {
      title: "Deployment",
      content: [
        "React SSG output is pure static files. It works on GitHub Pages, Netlify,",
        "and any static host without server runtimes.",
      ].join(" "),
    },
    {
      title: "Why Avoid SSR Runtime",
      content: [
        "SSR runtime introduces server dependencies and non-determinism. irgen favors",
        "build-time rendering for predictable artifacts.",
      ].join(" "),
    },
  ],
};
