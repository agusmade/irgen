import { frontend } from "../src/dsl/frontend-runtime.js";

frontend("irgen", {
  pwa: { enabled: true, name: "irgen", shortName: "irgen", startUrl: "/", scope: "/" },
  policies: {
    frontend: {
      styling: { theme: { primaryColor: "#0ea5e9", borderRadius: "lg" } },
    },
  },
}, (app) => {
  // --- PAGES ---

  app.page("Home", { path: "/" }, (p) => {
    p.component("HeroSection");
    p.component("TrustedLogos");
    p.component("FeatureDeck");
    p.component("PipelineRow");
    p.component("AgentChat");
    p.component("Testimonials");
    p.component("FaqSection");
    p.component("CtaSection");
  });

  app.page("Features", { path: "/features" }, (p) => {
    p.component("FeaturesHero");
    p.component("GenerationGapDetail");
    p.component("BackendCapabilities");
    p.component("FrontendRichness");
    p.component("ElectronSecurity");
  });

  app.page("Docs", { path: "/docs" }, (p) => {
    p.component("DocsHero");
    p.component("InstallationGuide");
    p.component("BasicDslExample");
    p.component("AdvancedConfig");
  });

  app.page("Showcase", { path: "/showcase" }, (p) => {
    p.component("ShowcaseHero");
    p.component("KitchenSinkForm");
    p.component("LayoutDemo");
  });

  app.page("CLI", { path: "/cli" }, (p) => {
    p.component("CliHero");
    p.component("CliUsage");
    p.component("PolicyOverrides");
  });

  // --- COMPONENTS ---

  // -- Home Components --

  app.component("HeroSection", (c) => {
    c.hero({
      badge: "Policy-Driven IR Toolchain",
      title: "Write domain and policy. Let irgen handle the rest.",
      subtitle: "irgen is a compiler-style code generation toolchain that transforms system descriptions into high-quality, multi-target source code—built for architectural clarity and long-term maintainability.",
      actions: [
        { label: "Explore Features", href: "/features", variant: "primary", icon: "Zap" },
        { label: "View Docs", href: "/docs", variant: "secondary", icon: "BookOpen" }
      ]
    });
  });

  app.component("TrustedLogos", (c) => {
    c.logos([
      { title: "React", icon: "Atom" },
      { title: "Vite", icon: "Zap" },
      { title: "Tailwind", icon: "Palette" },
      { title: "Prisma", icon: "Database" },
      { title: "Vitest", icon: "CheckCircle" },
      { title: "TypeScript", icon: "Code" }
    ], { title: "BUILT WITH MODERN STANDARDS" });
  });

  app.component("FeatureDeck", (c) => {
    c.features([
      { title: "Compiler-Style IR", description: "Transform system descriptions through explicit IR stages—ensuring multi-target consistency and determinism.", icon: "Cpu" },
      { title: "Policy-Driven", description: "Control architectural rules and emitter behavior globally without touching manual implementation code.", icon: "ShieldCheck" },
      { title: "Generation Gap", description: "Hard separation between generated plumbing and your manual logic. Regenerate with zero conflicts.", icon: "Layers" }
    ], { title: "Engineered for Architectural Clarity", subtitle: "Stop building scaffolds. Use a toolchain that handles complexity like a compiler." });
  });

  app.component("PipelineRow", (c) => {
    c.timeline([
      { title: "Input: Domain & Policy", description: "Describe your system's data structures and architectural constraints." },
      { title: "Intermediate Representation", description: "Engine lowers input to validated, target-agnostic IR stages." },
      { title: "Target Transformation", description: "IR is refined into target-specific models like Postgres, React, or Electron." },
      { title: "Multi-target Emission", description: "Production-ready source code is emitted using specialized, policy-aware emitters." }
    ], { title: "The Compilation Pipeline" });
  });

  app.component("AgentChat", (c) => {
    c.html = `
      <div class="max-w-2xl mx-auto rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">AI Copilot Integration</p>
        <div class="space-y-6">
          <div class="flex gap-4">
            <div class="h-10 w-10 shrink-0 rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-white">U</div>
            <div class="flex-1 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-600 dark:text-slate-300 shadow-sm">
              "Create a user management dashboard with a multi-step registration form and automated PWA configuration."
            </div>
          </div>
          <div class="flex gap-4">
            <div class="h-10 w-10 shrink-0 rounded-full bg-sky-500 flex items-center justify-center text-sm font-bold text-white">A</div>
            <div class="flex-1 rounded-2xl bg-sky-50 dark:bg-sky-900/20 p-4 text-sm text-sky-900 dark:text-sky-100 shadow-sm border border-sky-100/50 dark:border-sky-500/10">
              Generating DSL for <span class="font-bold">DashboardApp</span>...<br/>
              - Lowering <span class="font-mono">UserForm</span> with visibility logic<br/>
              - Injecting <span class="font-mono">PwaPolicy</span><br/>
              - Ready to emit React + Prisma hooks.
            </div>
          </div>
        </div>
      </div>
    `;
  });

  app.component("Testimonials", (c) => {
    c.testimonials([
      { author: "Alex Rivers", role: "Solutions Architect", description: "The only tool that doesn't make me regret using a generator six months later.", image: "https://i.pravatar.cc/100?u=alex" },
      { author: "Jordan Lee", role: "Product Engineer", description: "Generation Gap is a game changer for maintenance.", image: "https://i.pravatar.cc/100?u=jordan" }
    ], { title: "Loved by Engineers" });
  });

  app.component("FaqSection", (c) => {
    c.faq([
      { title: "Is irgen a scaffolding tool?", description: "No. Scaffolders create a one-time setup. irgen is a compiler that manages your system throughout its entire lifecycle via Intermediate Representation." },
      { title: "What is the 'Generation Gap'?", description: "It's a pattern where irgen writes to 'Base' segments and you write to 'User' segments. This prevents your manual changes from being overwritten during regeneration." },
      { title: "Can I use it with existing databases?", description: "Yes. By providing a Prisma schema or defining entities in the DSL, irgen manages the mapping and target consistency." }
    ], { title: "Frequently Asked Questions" });
  });

  app.component("CtaSection", (c) => {
    c.cta("Ready to Build?", "Join the future of robust code generation. Ship faster without compromising on quality.", [
      { label: "Get Started Now", href: "/docs", variant: "primary", icon: "ArrowRight" }
    ]);
  });

  // -- Features Components --

  app.component("FeaturesHero", (c) => {
    c.hero({
      title: "Technical Excellence by Design",
      subtitle: "irgen isn't just about speed; it's about building maintainable, enterprise-grade architecture automatically.",
    });
  });

  app.component("GenerationGapDetail", (c) => {
    c.features([
      { title: "Base Classes", description: "Automatically generated and always up-to-date with your DSL.", icon: "Box" },
      { title: "Hook Methods", description: "Pre-defined interceptors for business logic like beforeCreate/afterDelete.", icon: "Anchor" },
      { title: "Clean Inheritance", description: "Your custom code lives in separate files, making version control a breeze.", icon: "GitBranch" }
    ], { title: "The Generation Gap Pattern", subtitle: "Never face a merge conflict with a generator again." });
  });

  app.component("BackendCapabilities", (c) => {
    c.features([
      { title: "Prisma Integration", description: "Type-safe database access with automated schema generation.", icon: "Database" },
      { title: "Repository Pattern", description: "Encapsulated data logic with built-in support for relationships.", icon: "Table" },
      { title: "Service Layer", description: "Robust business logic housing with dependency injection.", icon: "Cpu" }
    ], { title: "Powerful Backend Emitter" });
  });

  app.component("FrontendRichness", (c) => {
    c.features([
      { title: "Dynamic Forms", description: "Visibility logic, validation, and async data source binding.", icon: "FileText" },
      { title: "PWA Support", description: "One-click Service Worker, manifest, and icon generation.", icon: "Smartphone" },
      { title: "Navigation Engine", description: "Automated React Router setup with breadcrumbs and layout nesting.", icon: "Map" }
    ], { title: "Premium Frontend Emitter" });
  });

  app.component("ElectronSecurity", (c) => {
    c.features([
      { title: "Context Isolation", description: "Hardened renderer with zero direct access to Node.js APIs.", icon: "ShieldCheck" },
      { title: "IPC Whitelists", description: "Strictly defined communication channels between main and renderer.", icon: "MessageSquare" },
      { title: "Auto-Updates", description: "Built-in wiring for seamless application delivery.", icon: "RefreshCw" }
    ], { title: "Hardened Desktop Shell" });
  });

  // -- Docs Components --

  app.component("DocsHero", (c) => {
    c.hero({
      title: "Documentation",
      subtitle: "Everything you need to know to master the irgen engine.",
    });
  });

  app.component("InstallationGuide", (c) => {
    c.html = `
      <div class="max-w-3xl mx-auto space-y-8">
        <section>
          <h3 class="text-2xl font-bold mb-4">Installation</h3>
          <div class="bg-slate-900 rounded-xl p-4 font-mono text-sm text-sky-400">
            npm install irgen
          </div>
        </section>
      </div>
    `;
  });

  app.component("BasicDslExample", (c) => {
    c.layout = { kind: "panel", title: "Your First DSL" };
    c.content = "Define an application in a few lines of TypeScript.";
    c.code(`import { app, frontend } from "irgen";

frontend("MyWeb", { pwa: { enabled: true } }, (app) => {
  app.page("Home", "/", (p) => {
    p.component("Hero");
  });
});`, "typescript");
  });

  app.component("AdvancedConfig", (c) => {
    c.html = `
      <div class="max-w-3xl mx-auto py-12">
        <h3 class="text-2xl font-bold mb-4">Advanced Configuration</h3>
        <p class="text-slate-600 dark:text-slate-400 mb-6">Use policies to control the behavior of the engine and emitters.</p>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <h4 class="font-bold mb-2">Styling Policy</h4>
            <p class="text-xs text-slate-500">Control primary colors, border radii, and font families globally.</p>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <h4 class="font-bold mb-2">Backend Policy</h4>
            <p class="text-xs text-slate-500">Set ID generation strategies and logging adapters.</p>
          </div>
        </div>
      </div>
    `;
  });

  // -- Showcase Components --

  app.component("ShowcaseHero", (c) => {
    c.hero({
      title: "UI Showcase",
      subtitle: "A demonstration of the various interactive components generated by our React emitter.",
    });
  });

  app.component("KitchenSinkForm", (c) => {
    c.layout = { kind: "panel", title: "Rich Form Capabilities" };
    c.form = {
      fields: [
        { name: "name", type: "text", label: "Full Name", placeholder: "John Doe" },
        { name: "type", type: "select", label: "User Type", options: [{ label: "Admin", value: "admin" }, { label: "Regular", value: "user" }] },
        { name: "bio", type: "textarea", label: "Biography", description: "Tell us about yourself." },
        { name: "newsletter", type: "checkbox", label: "Subscribe to newsletter" }
      ],
      submit: { url: "https://api.example.com/mock", successMessage: "Form submitted successfully!" }
    };
  });

  app.component("LayoutDemo", (c) => {
    c.layout = {
      kind: "tabs",
      title: "Adaptive Layouts",
      tabs: [
        { label: "Tab One", content: "This content is rendered inside a tab component." },
        { label: "Tab Two", content: "Tabs can contain any other generated components." }
      ]
    };
  });

  // -- CLI Components --

  app.component("CliHero", (c) => {
    c.hero({
      title: "Command Line Interface",
      subtitle: "The engine's powerful CLI allows for granular control over the generation process.",
    });
  });

  app.component("CliUsage", (c) => {
    c.html = `
      <div class="max-w-3xl mx-auto space-y-6">
        <h3 class="text-2xl font-bold">Standard Usage</h3>
        <div class="bg-slate-900 rounded-xl p-4 font-mono text-sm text-green-400">
          npx tsx src/cli.ts examples/app.dsl.ts generated/output --mode=frontend
        </div>
        <div class="grid gap-4 mt-8">
          <div class="p-6 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <h4 class="font-bold mb-2">--targets</h4>
            <p class="text-sm text-slate-500 italic">"backend,frontend,electron"</p>
          </div>
          <div class="p-6 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <h4 class="font-bold mb-2">--mode</h4>
            <p class="text-sm text-slate-500 italic">"fullstack", "backend", or "frontend"</p>
          </div>
        </div>
      </div>
    `;
  });

  app.component("PolicyOverrides", (c) => {
    c.cta("Policy Overrides", "You can override any DSL-defined policy directly from the CLI using JSON strings.", [
      { label: "Learn More", href: "/docs", variant: "ghost", icon: "Info" }
    ]);
  });
});
