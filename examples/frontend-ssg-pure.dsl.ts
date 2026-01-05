import { frontend } from "../src/dsl/frontend-runtime";

// Example frontend app with pure SSG (no hydration).
frontend("FrontendSsgPure", (f) => {
  f.policy("frontend", {
    framework: {
      rendering: {
        mode: "ssg",
        prerender: {
          enabled: true,
          routes: "auto",
          outDir: "dist",
          emitSitemap: true,
          emitRobotsTxt: true,
        },
      },
    },
  });

  f.page("Home", { path: "/" }, (p) => {
    p.component("Hero");
    p.component("Highlights");
  });

  f.page("Docs", { path: "/docs" }, (p) => {
    p.component("DocsIntro");
    p.component("Topics");
  });

  f.component("Hero", (c) => {
    c.hero({
      title: "Pure SSG Demo",
      subtitle: "Static HTML only. No hydration scripts are emitted.",
      actions: [{ label: "Read Docs", href: "/docs", variant: "primary" }],
    });
  });

  f.component("Highlights", (c) => {
    c.features(
      [
        { title: "Zero JS", description: "No hydration in mode=ssg." },
        { title: "SEO", description: "HTML output is final and crawlable." },
        { title: "Simple", description: "Static pages without interactivity." },
      ],
      { title: "Highlights" }
    );
  });

  f.component("DocsIntro", (c) => {
    c.content = "This page is entirely static.";
  });

  f.component("Topics", (c) => {
    c.layout = {
      kind: "column",
      title: "Topics",
      items: ["TopicOne", "TopicTwo"],
    };
  });

  f.component("TopicOne", (c) => {
    c.content = "SSG output lives directly in the root outDir.";
  });

  f.component("TopicTwo", (c) => {
    c.content = "No hydration scripts are injected for SSG mode.";
  });
});
