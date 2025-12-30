import { frontend } from "../src/dsl/frontend-runtime.js";

frontend("IR Codegen Docs", { pwa: { enabled: true, name: "IR Codegen Docs", shortName: "IRDocs", startUrl: "/", scope: "/" } }, (app) => {
  app.page("Home", { path: "/" }, (p) => {
    p.component("Intro");
    p.component("Highlights");
    p.component("GettingStarted");
  });

  app.page("CLI", { path: "/cli" }, (p) => {
    p.component("CliUsage");
    p.component("Policies");
  });

  app.page("Frontend", { path: "/frontend" }, (p) => {
    p.component("PwaGuide");
    p.component("TailwindAndVite");
    p.component("FormFeatures");
    p.component("LayoutFeatures");
  });

  app.page("Backend", { path: "/backend" }, (p) => {
    p.component("BackendOverview");
  });

  app.page("Feedback", { path: "/feedback" }, (p) => {
    p.component("FeedbackForm");
  });

  app.component("Intro", (c) => {
    c.prop("summary", "DSL -> IR -> Emitters generate backend+frontend with Generation Gap Pattern and Prisma, plus optional PWA.");
    c.prop("ownership", "Generated code is owned by tool; user code preserved via Generation Gap scaffolding.");
  });

  app.component("Highlights", (c) => {
    c.prop("backend", "Repositories, services with hooks, Prisma adapter, generated tests.");
    c.prop("frontend", "React + Tailwind + router, forms with async selects, icons, optional PWA.");
    c.prop("dx", "CLI orchestration via --targets=backend,frontend and policy overrides.");
  });

  app.component("GettingStarted", (c) => {
    c.prop("install", "npm install");
    c.prop("generate", "npx tsx src/cli.ts examples/docs.dsl.ts generated/docs --targets=backend,frontend");
    c.prop("runFrontend", "cd generated/docs/frontend && npm install && npm run dev");
  });

  app.component("CliUsage", (c) => {
    c.prop("listEmitters", "npx tsx src/cli.ts --emitters");
    c.prop("backendOnly", "npx tsx src/cli.ts examples/app.dsl.ts generated/app --mode=backend");
    c.prop("frontendOnly", "npx tsx src/cli.ts examples/frontend.dsl.ts generated/frontend --mode=frontend");
  });

  app.component("Policies", (c) => {
    c.prop("backend", `Set in DSL meta/policies or override with --policies='{\"backend\":{\"generateId\":\"uuid_v4\"}}'`);
    c.prop("frontendPwa", `Set pwa in frontend(..., { pwa }) or override with --policies='{\"frontend\":{\"pwa\":{\"enabled\":true}}}'`);
  });

  app.component("PwaGuide", (c) => {
    c.prop("enable", "Set pwa.enabled=true via CLI policies or DSL options.");
    c.prop("outputs", "manifest.webmanifest, pwa-sw.js, icons/icon.svg (served from public/).");
    c.prop("verify", "Check Application tab > Manifest and Service Workers after npm run dev.");
  });

  app.component("TailwindAndVite", (c) => {
    c.prop("tailwind", "Tailwind config + PostCSS emitted; styles sourced from src/index.css.");
    c.prop("vite", "Vite config with @vitejs/plugin-react; dev/build scripts available.");
  });

  app.component("FormFeatures", (c) => {
    c.prop("fields", "text/number/select/textarea/checkbox/radio/date/datetime/time/url/phone/password/daterange, slider, currency, tags, file upload, signature");
    c.prop("validation", "required/requiredIf, min/max, min/max length, pattern, compare fields, email/url, custom logic (JSONLogic-like)");
    c.prop("logic", "visible/disabled/default/compute via sandboxed logic evaluator");
    c.prop("ux", "async select with search/pagination/debounce, clearable selects, prefix/suffix/tooltip/helpHtml/className, loading/error states");
    c.prop("actions", "submit pipeline with success/error UI, before/after hooks, onSuccess/onError, redirect, draft save");
  });

  app.component("LayoutFeatures", (c) => {
    c.prop("containers", "row/column/panel/tabs with real child components");
    c.prop("content", "static content/HTML blocks, CTA buttons with variants/icons");
    c.prop("pwa", "optional PWA assets and service worker when enabled");
  });

  app.component("BackendOverview", (c) => {
    c.prop("entities", "Define in DSL; operations create/get/list/update/remove generate repositories/services/controllers.");
    c.prop("db", "Prisma adapter configurable via app.meta('db', { provider, url }).");
    c.prop("hooks", "beforeCreate/afterCreate/etc for custom logic.");
  });

  app.component("FeedbackForm", (c) => {
    c.field("name", "text", "Name", { required: true }, { icon: "User" });
    c.field("email", "email", "Email", { required: true }, { icon: "Mail" });
    c.field("message", "textarea", "Message", { required: true, minLength: 5 }, { icon: "MessageSquare", placeholder: "Share your thoughts" });
  });
});
