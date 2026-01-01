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

  app.page("Architecture", { path: "/architecture" }, (p) => {
    p.component("PipelineFlow");
    p.component("LoweringEngine");
    p.component("SharedLib");
  });

  app.page("Frontend", { path: "/frontend" }, (p) => {
    p.component("PwaGuide");
    p.component("TailwindAndVite");
    p.component("FormFeatures");
    p.component("LogicOptimizations");
    p.component("FrontendPolicies");
    p.component("LayoutFeatures");
  });

  app.page("Backend", { path: "/backend" }, (p) => {
    p.component("BackendOverview");
    p.component("GenerationGap");
  });

  app.page("Extensions", { path: "/extensions" }, (p) => {
    p.component("ExtensionSystem");
    p.component("ElectronSample");
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
    c.prop("fullstack", "npx tsx src/cli.ts examples/app.dsl.ts --targets=backend,frontend --outDir=gen/app");
    c.prop("extensions", "npx tsx src/cli.ts --ext path/to/extension.ts");
    c.prop("inspectIR", "npx tsx src/cli.ts ... --inspect-ir (prints lowered TargetIR)");
  });

  app.component("Policies", (c) => {
    c.prop("concept", "Policies drive emitter decisions without logic embedding in IR.");
    c.prop("backend", `Set in DSL meta/policies or override with --policies='{\"backend\":{\"generateId\":\"uuid_v4\"}}'`);
    c.prop("frontend", `Supports styling (primaryColor) and framework (iconLibrary) config.`);
  });

  app.component("PipelineFlow", (c) => {
    c.prop("stages", "DSL -> DeclBundle (Normalize) -> Mapper -> DomainIR -> Lowering -> TargetIR -> Emitter");
    c.prop("agnosticism", "Mappers are target-agnostic; Lowering applies target-specific conventions.");
  });

  app.component("LoweringEngine", (c) => {
    c.prop("purpose", "Transforms DomainIR (WHAT) into TargetIR (HOW) using Policies.");
    c.prop("logicLowering", "Complex predicates (visibility, compute) are lowered into structured instructions with dependency tracking.");
    c.prop("validationLowering", "DSL validators are lowered into a canonical rule set for the emitter.");
  });

  app.component("SharedLib", (c) => {
    c.prop("concept", "Critical logic is moved from emitters to a shared generated library.");
    c.prop("frontend", "src/lib/logic.ts (evalLogic, getByPath, isEmptyVal).");
    c.prop("backend", "src/lib/id.ts, src/lib/logger.ts, etc.");
  });

  app.component("LogicOptimizations", (c) => {
    c.prop("dependencyTracking", "Lowering extracts state dependencies from logical expressions.");
    c.prop("optimizedHooks", "Generated useEffect hooks trigger ONLY when their specific dependencies change.");
    c.prop("headless", "Emitter receives instructions, not scripts, ensuring static-site compatibility.");
  });

  app.component("FrontendPolicies", (c) => {
    c.prop("styling", "Custom primary colors and border radius via policies.frontend.styling.");
    c.prop("framework", "Choose icon libraries (lucide-react) or runtimes via policies.frontend.framework.");
  });

  app.component("GenerationGap", (c) => {
    c.prop("concept", "Base classes/components are fully generated; implementations are scaffolded once.");
    c.prop("preservation", "Manual changes in implementation files are PRESERVED during regeneration.");
  });

  app.component("ExtensionSystem", (c) => {
    c.prop("capability", "Extensions can register mappers, emitters, and target mappings.");
    c.prop("usage", "Load via CLI --ext or programmatic Codegen options.");
  });

  app.component("ElectronSample", (c) => {
    c.prop("platform", "Generates main, preload, and IPC handlers for Electron apps.");
    c.prop("security", "Hardened settings: contextIsolation, CSP guards, IPC whitelisting.");
    c.prop("sharedIR", "Uses the same FrontendIR as the web/PWA target.");
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
