import { frontend } from "../src/dsl/frontend-runtime.js";
import { DOCS_SECTIONS, DOCS_SIDEBAR_GROUPS } from "./docs-content/index.js";

const DOCS_DATA = {
  sections: DOCS_SECTIONS,
};

const DOCS_GROUP_BY_ID = new Map<string, string>();
DOCS_SIDEBAR_GROUPS.forEach((group) => {
  group.ids.forEach((id) => DOCS_GROUP_BY_ID.set(id, group.label));
});

const safeComponentName = (value: string): string => {
  const cleaned = value.replace(/[^A-Za-z0-9_]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
};

frontend("irgen", {
  pwa: { enabled: true, name: "irgen", shortName: "irgen", startUrl: "/", scope: "/" },
  policies: {
    frontend: {
      styling: { theme: { primaryColor: "#0ea5e9", borderRadius: "lg" } },
    },
  },
}, (app) => {
  // --- PAGES ---

  app.page("Home", {
    path: "/",
    hideHeader: true,
    description: "Welcome to irgen, the compiler-style code generation toolchain."
  }, (p) => {
    p.component("HeroSection");
    p.component("TrustedLogos");
    p.component("FeatureDeck");
    p.component("PipelineRow");
    p.component("AgentChat");
    p.component("Testimonials");
    p.component("FaqSection");
    p.component("CtaSection");
  });

  app.page("Features", {
    path: "/features",
    hideHeader: true,
    description: "Explore the advanced capabilities of the irgen toolchain, from Generation Gap to Electron security."
  }, (p) => {
    p.component("FeaturesHero");
    p.component("GenerationGapDetail");
    p.component("BackendCapabilities");
    p.component("FrontendRichness");
    p.component("ElectronSecurity");
  });

  // Docs pages (split per section for sidebar + TOC)
  DOCS_DATA.sections.forEach((section) => {
    app.page(section.title, {
      path: section.id === "quick-start" ? "/docs" : `/docs/${section.id}`,
      hideHeader: (section as any).hideHeader ?? true,
      description: (section as any).description ?? "Documentation",
      docsLayout: true,
      docsGroupLabel: DOCS_GROUP_BY_ID.get(section.id) ?? "Docs",
    }, (p) => {
      const emitBlock = (block: any, idx: number, prefix: string, scope: "page" | "app"): string => {
        const name = safeComponentName(`${prefix}Block${idx}`);
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
            c.features(block.items, { align: "center" });
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
          const childNames = (block.blocks ?? [])
            .map((child: any, childIdx: number) =>
              emitBlock(child, childIdx, `${name}Child`, "app"),
            )
            .filter((childName: string) => !!childName);
          p.component(name, (c) => {
            c.layout = { kind: "panel", title: block.title, items: childNames };
            c.prop("docsLayout", "true");
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

  app.page("Showcase", {
    path: "/showcase",
    hideHeader: true,
    description: "Interactive demonstration of generated UI components and layouts."
  }, (p) => {
    p.component("ShowcaseHero");
    p.component("KitchenSinkForm");
    p.component("LayoutDemo");
  });

  app.page("CLI", {
    path: "/cli",
    hideHeader: true,
    description: "Master the irgen CLI with this power-user reference guide."
  }, (p) => {
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
    ], { title: "Engineered for Architectural Clarity", subtitle: "Stop building scaffolds. Use a toolchain that handles complexity like a compiler.", align: "center"});
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
    c.agentChat({
      title: "AI Copilot Integration",
      messages: [
        {
          role: "user",
          label: "U",
          content: "Create a user management dashboard with a multi-step registration form and automated PWA configuration."
        },
        {
          role: "agent",
          label: "A",
          content: "Generating DSL for DashboardApp...\n- Lowering UserForm with visibility logic\n- Injecting PwaPolicy\n- Ready to emit React + Prisma hooks."
        }
      ]
    });
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
    ], { title: "The Generation Gap Pattern", subtitle: "Never face a merge conflict with a generator again.", align: "center"});
  });

  app.component("BackendCapabilities", (c) => {
    c.features([
      { title: "Prisma Integration", description: "Type-safe database access with automated schema generation.", icon: "Database" },
      { title: "Repository Pattern", description: "Encapsulated data logic with built-in support for relationships.", icon: "Table" },
      { title: "Service Layer", description: "Robust business logic housing with dependency injection.", icon: "Cpu" }
    ], { title: "Powerful Backend Emitter", align: "center"});
  });

  app.component("FrontendRichness", (c) => {
    c.features([
      { title: "Dynamic Forms", description: "Visibility logic, validation, and async data source binding.", icon: "FileText" },
      { title: "PWA Support", description: "One-click Service Worker, manifest, and icon generation.", icon: "Smartphone" },
      { title: "Navigation Engine", description: "Automated React Router setup with breadcrumbs and layout nesting.", icon: "Map" }
    ], { title: "Premium Frontend Emitter", align: "center"});
  });

  app.component("ElectronSecurity", (c) => {
    c.features([
      { title: "Context Isolation", description: "Hardened renderer with zero direct access to Node.js APIs.", icon: "ShieldCheck" },
      { title: "IPC Whitelists", description: "Strictly defined communication channels between main and renderer.", icon: "MessageSquare" },
      { title: "Auto-Updates", description: "Built-in wiring for seamless application delivery.", icon: "RefreshCw" }
    ], { title: "Hardened Desktop Shell", align: "center"});
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
    c.cliUsage({
      title: "Standard Usage",
      command: "npx irgen examples/app.dsl.ts generated/output --mode=frontend",
      options: [
        { flag: "--targets", description: "backend,frontend,electron" },
        { flag: "--mode", description: "fullstack, backend, or frontend" }
      ]
    });
  });

  app.component("PolicyOverrides", (c) => {
    c.cta("Policy Overrides", "You can override any DSL-defined policy directly from the CLI using JSON strings.", [
      { label: "Learn More", href: "/docs", variant: "ghost", icon: "Info" }
    ]);
  });
});
