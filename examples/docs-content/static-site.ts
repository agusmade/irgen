import type { DocSection } from "./types.js";

export const staticSiteSection: DocSection = {
  id: "static-site",
  title: "Static Site",
  subtitle: "HTML-first with progressive enhancement.",
  description: "Static Site output guarantees readability without JavaScript.",
  content: [
    "Static Site is a separate target with a strict HTML-first contract. HTML is",
    "fully rendered at build time, CSS handles presentation, and JavaScript is",
    "optional and only used for enhancements.",
  ].join(" "),
  code: {
    language: "html",
    snippet: "<pre><code class=\"language-ts\">const msg = \"hello\";</code></pre>",
  },
  subsections: [
    {
      title: "What Static Site Means",
      content: [
        "Static Site output guarantees that HTML is fully rendered at build time and",
        "remains readable without JavaScript. HTML is the source of truth.",
      ].join(" "),
    },
    {
      title: "Why It Is a Separate Target",
      content: [
        "React SSG uses React tooling and bundles even when pages are not hydrated.",
        "Static Site exists for content that must remain readable and durable without",
        "client frameworks or runtime assumptions.",
      ].join(" "),
    },
    {
      title: "HTML-First Contract",
      content: [
        "Every page is a complete HTML document. Links use standard <a href>, and",
        "content remains readable without JS.",
      ].join(" "),
    },
    {
      title: "Progressive Enhancement",
      content: [
        "Enhancements such as search, copy code, and theme toggle are optional and",
        "capability-driven. They must never replace core content.",
      ].join(" "),
    },
    {
      title: "Capability-Driven JS",
      content: [
        "Enhancement scripts are included only when capabilities are detected. If no",
        "enhancements are needed, no JS is emitted.",
      ].join(" "),
    },
    {
      title: "Degradation Rules",
      content: [
        "Incompatible components degrade or emit warnings. Dynamic routes are skipped",
        "with explicit warnings to preserve determinism.",
      ].join(" "),
    },
    {
      title: "Code Blocks and Highlighting",
      content: [
        "Code blocks render as semantic HTML with optional pre-highlighted output.",
        "Client-side highlighting is optional and policy-driven.",
      ].join(" "),
    },
    {
      title: "CSS Responsibilities",
      content: [
        "CSS must establish layout, typography, and hierarchy. HTML must not rely on",
        "JS to look correct.",
      ].join(" "),
    },
    {
      title: "Accessibility and SEO",
      content: [
        "Static Site output uses semantic HTML, stable URLs, and optional sitemap and",
        "robots.txt generation for SEO.",
      ].join(" "),
    },
    {
      title: "Routing and Base URL",
      content: [
        "Routing is filesystem-based with folder style output. baseUrl is resolved",
        "during lowering for subpath hosting.",
      ].join(" "),
    },
    {
      title: "Explicit Non-Goals",
      content: [
        "Static Site avoids client-side routing, hydration, runtime data fetching, and",
        "framework-specific behavior. These are deliberate boundaries.",
      ].join(" "),
    },
  ],
};
