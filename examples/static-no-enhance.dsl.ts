import { frontend } from "../src/dsl/frontend-runtime.js";

frontend("Static No Enhance", (app) => {
  app.policy("static-site", {
    staticSite: {
      outDir: "dist",
      assets: { hashing: false },
      enhancements: { enabled: true, features: [] },
      codeHighlight: { mode: "pre", theme: "github-dark", addCopyButton: false },
      search: { mode: "none" },
      seo: {
        defaultTitle: "Static No Enhance",
        titleTemplate: "%s · Static",
        defaultDescription: "Baseline static output without enhancements.",
      },
    },
  });

  app.page("Home", { path: "/", description: "Baseline static page." }, (p) => {
    p.component("Intro", (c) => {
      c.content = "A minimal static example with basic content.";
    });

    p.component("Features", (c) => {
      c.features([
        { title: "Fast", description: "No client runtime required." },
        { title: "Deterministic", description: "Pure HTML output." },
      ]);
    });

    p.component("Stats", (c) => {
      c.stats([
        { label: "Pages", value: "2" },
        { label: "Enhancements", value: "0" },
      ]);
    });

    p.component("Snippet", (c) => {
      c.code("console.log(\"hello static\");", "javascript", { showLineNumbers: false });
    });
  });

  app.page("Guide", { path: "/guide", description: "Static guide page." }, (p) => {
    p.component("Timeline", (c) => {
      c.timeline([
        { title: "Define", description: "Declare pages and components." },
        { title: "Emit", description: "Generate HTML output." },
      ]);
    });
  });
});
