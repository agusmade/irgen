import { frontend } from "../src/dsl/frontend-runtime.js";

frontend("Static With Enhance", (app) => {
  app.policy("static-site", {
    staticSite: {
      outDir: "dist",
      assets: { hashing: false },
      enhancements: {
        enabled: true,
        features: ["sidebarToggle", "copyCode", "themeToggle", "tocScrollSpy", "search"],
      },
      codeHighlight: { mode: "pre", theme: "github-dark", addCopyButton: true },
      search: { mode: "client_index", indexFile: "assets/search-index.json" },
      seo: {
        defaultTitle: "Static With Enhance",
        titleTemplate: "%s · Static",
        defaultDescription: "Static output with progressive enhancements enabled.",
      },
    },
  });

  app.page("Home", { path: "/", description: "Enhanced static page." }, (p) => {
    p.component("Hero", (c) => {
      c.hero({
        badge: "Static",
        title: "Progressive Enhancements",
        subtitle: "Sidebar toggle, copy code, theme toggle, and search.",
      });
    });

    p.component("CTA", (c) => {
      c.cta("Try it now", "External links are marked safely.", [
        { label: "Docs", href: "https://example.com/docs" },
      ]);
    });

    p.component("Code", (c) => {
      c.code("const answer = 42;\nconsole.log(answer);", "typescript");
    });
  });

  app.page("Details", { path: "/details", description: "TOC and search content." }, (p) => {
    p.component("SectionOne", (c) => {
      c.content = "Section one content for TOC.";
    });
    p.component("SectionTwo", (c) => {
      c.content = "Section two content for TOC.";
    });
  });
});
