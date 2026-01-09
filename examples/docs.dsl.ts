import { frontend } from "../src/dsl/frontend-runtime.js";
import { DOCS_SECTIONS, DOCS_SIDEBAR_GROUPS } from "./docs-content/index.js";

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
      },
      sidebar: {
        groups: DOCS_SIDEBAR_GROUPS.map((group) => ({
          label: group.label,
          items: group.ids.map((id) => (id === "quick-start" ? "/" : `/${id}/`)),
        })),
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
      const emitBlock = (block: any, idx: number, prefix: string, scope: "page" | "app"): string => {
        const name = `${prefix}Block${idx}`;
        const defineComponent = (cb: (c: any) => void) => {
          if (scope === "page") {
            p.component(name, cb);
          } else {
            app.component(name, cb);
          }
        };
        if (block.type === "paragraph") {
          defineComponent((c) => {
            c.content = block.text;
            c.prop("hideTitle", "true");
          });
          return name;
        }
        if (block.type === "code") {
          defineComponent((c) => {
            c.code(block.snippet, block.language);
            c.prop("hideTitle", "true");
          });
          return name;
        }
        if (block.type === "features") {
          defineComponent((c) => {
            c.features(block.items);
            c.prop("hideTitle", "true");
          });
          return name;
        }
        if (block.type === "hero") {
          defineComponent((c) => {
            c.hero({
              badge: block.badge,
              title: block.title,
              subtitle: block.subtitle
            });
            c.prop("hideTitle", "true");
          });
          return name;
        }
        if (block.type === "calloutLinks") {
          defineComponent((c) => {
            const links = (block.links ?? []).map((link: any) => ({
              label: link.label,
              href: link.href,
            }));
            c.cta("", "", links);
            c.prop("hideTitle", "true");
          });
          return name;
        }
        if (block.type === "section") {
          const childNames = (block.blocks ?? []).map((child: any, childIdx: number) =>
            emitBlock(child, childIdx, `${name}Child`, "app"),
          );
          p.component(name, (c) => {
            c.layout = { kind: "panel", title: block.title, items: childNames };
          });
          return name;
        }
        return name;
      };

      section.content.forEach((block: any, idx: number) => {
        emitBlock(block, idx, section.id, "page");
      });
    });
  });

  // Footer component
  app.component("DocsFooter", (c) => {
    c.content = "© 2026 irgen Toolchain. Built for architectural excellence.";
  });
});
