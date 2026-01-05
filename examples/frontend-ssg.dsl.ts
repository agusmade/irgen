import { frontend } from "../src/dsl/frontend-runtime";

// Example frontend app with SSG/Hybrid policy enabled.
frontend("FrontendSsgDemo", (f) => {
  f.policy("frontend", {
    framework: {
      rendering: {
        mode: "hybrid",
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
    p.component("TabbedSection");
  });

  f.page("Contact", { path: "/contact" }, (p) => {
    p.component("ContactForm");
  });

  f.component("Hero", (c) => {
    c.hero({
      title: "Frontend SSG Demo",
      subtitle: "Static output with optional hydration for interactive sections.",
      actions: [{ label: "Get Started", href: "/docs", variant: "primary" }],
    });
  });

  f.component("Highlights", (c) => {
    c.features(
      [
        { title: "SSG", description: "Pre-rendered HTML for SEO and fast loads." },
        { title: "Hybrid", description: "Hydration only when needed." },
        { title: "Vite", description: "Asset pipeline handled by Vite build." },
      ],
      { title: "Highlights" }
    );
  });

  f.component("DocsIntro", (c) => {
    c.content = "This page is mostly static. The tabs below are interactive.";
  });

  f.component("TabbedSection", (c) => {
    c.layout = {
      kind: "tabs",
      title: "Topics",
      tabs: [
        { label: "Overview", content: "SSG output lives in root outDir." },
        { label: "Routing", content: "Routes are derived from pages unless configured." },
      ],
    };
  });

  f.component("ContactForm", (c) => {
    c.field("name", "text", "Name", { required: true });
    c.field("email", "text", "Email", { required: true });
    c.field("message", "textarea", "Message", { required: true });
  });
});
