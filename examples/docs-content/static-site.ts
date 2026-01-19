import type { DocSection } from "./types.js";

export const staticSiteSection: DocSection = {
  id: "static-site",
  title: "Static Site",
  subtitle: "HTML-first with progressive enhancement.",
  description: "Static Site output guarantees readability without JavaScript.",
  content: [
    {
      type: "paragraph",
      text: [
        "Static Site is a separate target with a strict HTML-first contract. HTML is",
        "fully rendered at build time, CSS handles presentation, and JavaScript is",
        "optional and only used for enhancements.",
      ].join(" "),
    },
    {
      type: "code",
      language: "html",
      snippet: "<pre><code class=\"language-ts\">const msg = \"hello\";</code></pre>",
    },
    {
      type: "section",
      title: "What Static Site Means",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Static Site output guarantees that HTML is fully rendered at build time and",
            "remains readable without JavaScript. HTML is the source of truth.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Why It Is a Separate Target",
      blocks: [
        {
          type: "paragraph",
          text: [
            "React SSG uses React tooling and bundles even when pages are not hydrated.",
            "Static Site exists for content that must remain readable and durable without",
            "client frameworks or runtime assumptions.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "HTML-First Contract",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Every page is a complete HTML document. Links use standard <a href>, and",
            "content remains readable without JS.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Progressive Enhancement",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Enhancements such as search, copy code, and theme toggle are optional and",
            "capability-driven. They must never replace core content.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Capability-Driven JS",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Enhancement scripts are included only when capabilities are detected. If no",
            "enhancements are needed, no JS is emitted.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Degradation Rules",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Incompatible components degrade or emit warnings. Dynamic routes are skipped",
            "with explicit warnings to preserve determinism.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Code Blocks and Highlighting",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Code blocks render as semantic HTML with optional pre-highlighted output.",
            "Client-side highlighting is optional and policy-driven.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Markdown Content",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Content strings are parsed as lightweight Markdown. Headings feed the TOC,",
            "code fences map to code blocks, and links resolve against known routes.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "CSS Responsibilities",
      blocks: [
        {
          type: "paragraph",
          text: [
            "CSS must establish layout, typography, and hierarchy. HTML must not rely on",
            "JS to look correct.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Accessibility and SEO",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Static Site output uses semantic HTML, stable URLs, and optional sitemap and",
            "robots.txt generation for SEO.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Routing and Base URL",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Routing is filesystem-based with folder style output. baseUrl is resolved",
            "during lowering for subpath hosting.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Explicit Non-Goals",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Static Site avoids client-side routing, hydration, runtime data fetching, and",
            "framework-specific behavior. These are deliberate boundaries.",
          ].join(" "),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See Policies", href: "/docs/policies/" },
        { label: "See Policy Reference", href: "/docs/policy-reference/" },
      ],
    },
  ],
};
