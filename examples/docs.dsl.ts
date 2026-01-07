import { frontend } from "../src/dsl/frontend-runtime.js";
import { DOCS_SECTIONS } from "./docs-content/index.js";

/**
 * Shared Documentation Data
 * This structure is exported so that the main website (irgen-web.dsl.ts) 
 * can import it and display the same documentation content.
 */
export const DOCS_DATA = {
  sections: DOCS_SECTIONS,
};

/**
 * Standalone Documentation Site
 */
frontend("irgen Docs", {
  pwa: { enabled: true, name: "irgen Docs", shortName: "IRDocs", startUrl: "/", scope: "/" },
  policies: {
    staticSite: {
      // outDir: "dist",
      assets: { hashing: true },
      enhancements: {
        enabled: true,
        features: ["sidebarToggle", "copyCode", "themeToggle", "tocScrollSpy", "search", "mermaid"],
      },
      codeHighlight: { mode: "pre", theme: "github-dark", addCopyButton: true },
      search: { mode: "client_index", indexFile: "assets/search-index.json" },
      seo: {
        defaultTitle: "irgen Documentation",
        titleTemplate: "%s · irgen",
        defaultDescription: "Comprehensive guide to irgen's architecture-driven code generation toolchain.",
      },
      navbar: {
        links: [
          { label: "Website", href: "https://irgen.dev" },
          { label: "GitHub", href: "https://github.com" }
        ]
      }
    },
  }
}, (app) => {

  // Dynamically generate pages from DOCS_DATA
  DOCS_DATA.sections.forEach(section => {
    app.page(section.title, {
      path: section.id === "quick-start" ? "/" : "/" + section.id,
      hideHeader: (section as any).hideHeader,
      description: (section as any).description
    }, (p) => {

      // Hero Section for each page
      p.component(section.id + "Hero", (c) => {
        c.hero(section.hero || {
          title: section.title,
          subtitle: section.subtitle
        });
      });

      // Main Content
      p.component(section.id + "Content", (c) => {
        c.content = section.content;
        c.prop("hideTitle", "true");
      });

      const features = section.features;
      if (features?.length) {
        p.component(section.id + "Features", (c) => {
          c.features(features);
        });
      }

      const code = section.code;
      if (code) {
        p.component(section.id + "Code", (c) => {
          c.code(code.snippet, code.language);
          c.prop("hideTitle", "true");
        });
      }

      // Subsections
      if (section.subsections) {
        section.subsections.forEach((sub, idx) => {
          p.component(section.id + "Sub" + idx, (c) => {
            c.layout = { kind: "panel", title: sub.title };
            c.content = sub.content;
            if (sub.code) {
              c.code(sub.code.snippet, sub.code.language);
            }
          });
        });
      }
    });
  });

  // Footer component
  app.component("DocsFooter", (c) => {
    c.html = "<div class=\"mt-20 border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-slate-500 text-sm\"><p>© 2026 irgen Toolchain. Built for architectural excellence.</p></div>";
  });
});
