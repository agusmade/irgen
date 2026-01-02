import { frontend } from "../src/dsl/frontend-runtime.js";

/**
 * Shared Documentation Data
 * This structure is exported so that the main website (irgen-web.dsl.ts) 
 * can import it and display the same documentation content.
 */
export const DOCS_DATA = {
  sections: [
    {
      id: "intro",
      title: "Introduction",
      subtitle: "The future of robust code generation.",
      hideHeader: true,
      description: "Learn how irgen treats code generation as a compilation problem for maximum predictability.",
      content: "irgen is a compiler-style code generation toolchain built around Intermediate Representation (IR). It follows the Generation Gap pattern to ensure that generated code remains maintainable and regeneratable without losing manual custom logic.",
      hero: {
        badge: "Core Philosophy",
        title: "Architecture as a Compilation Problem",
        subtitle: "irgen transforms high-level system descriptions into production-ready source code across multiple targets."
      },
      features: [
        { title: "Deterministic", description: "IR-based transformations ensure the same input always produces the same reliable output.", icon: "CheckCircle" },
        { title: "Policy-Driven", description: "Control architectural rules, styling, and logic behavior globally through centralized policies.", icon: "ShieldCheck" },
        { title: "Multi-Target", description: "Emit optimized code for Backend, Frontend, Desktop (Electron), and beyond from a single source.", icon: "Layers" }
      ]
    },
    {
      id: "installation",
      title: "Installation",
      subtitle: "Get up and running in seconds.",
      content: "Install irgen as a dependency in your project to start defining your system.",
      code: {
        language: "bash",
        snippet: "npm install irgen\n# or\nyarn add irgen"
      }
    },
    {
      id: "dsl-guide",
      title: "DSL Guide",
      subtitle: "The language of architecture.",
      content: "Describe your application using our intuitive TypeScript-based DSL. Focus on entities, services, and UI components while the engine handles the wiring.",
      subsections: [
        {
          title: "Defining an Application",
          content: "The app function is the entry point for backend definitions.",
          code: {
            language: "typescript",
            snippet: "import { app } from \"irgen\";\n\napp(\"MyProject\", (be) => {\n  be.entity(\"User\", (e) => {\n    e.field(\"username\", \"string\", { unique: true });\n    e.field(\"email\", \"string\", { format: \"email\" });\n  });\n\n  be.service(\"UserService\", (s) => {\n    s.operation(\"register\", { input: \"User\", output: \"User\" });\n  });\n});"
          }
        },
        {
          title: "Defining a Frontend",
          content: "The frontend function defines your web or desktop interface.",
          code: {
            language: "typescript",
            snippet: "import { frontend } from \"irgen\";\n\nfrontend(\"AdminPanel\", (fe) => {\n  fe.page(\"Dashboard\", \"/\", (p) => {\n    p.component(\"UserList\", (c) => {\n      c.layout = { kind: \"panel\", title: \"Active Users\" };\n    });\n  });\n});"
          }
        }
      ]
    },
    {
      id: "architecture",
      title: "Architecture & IR",
      subtitle: "Under the hood of the irgen engine.",
      content: "irgen uses a multi-stage compilation pipeline to ensure correctness and flexibility.",
      features: [
        { title: "Lowering Engine", description: "Transforms high-level Domain IR into target-specific instructions.", icon: "Cpu" },
        { title: "Shared Libraries", description: "Common logic is extracted into a generated library for consistency across files.", icon: "Library" },
        { title: "Context Isolation", description: "Hardened security for desktop targets using IPC whitelisting.", icon: "Lock" }
      ],
      code: {
        language: "mermaid",
        snippet: "graph TD\n  DSL[DSL] --> Bundle[DeclBundle]\n  Bundle --> Mapper[Domain Mapper]\n  Mapper --> IR[Domain IR]\n  IR --> Lowering[Lowering Engine]\n  Lowering --> TargetIR[Target IR]\n  TargetIR --> Emitter[Emitter]\n  Emitter --> Code[Source Code]"
      }
    },
    {
      id: "cli",
      title: "CLI Reference",
      subtitle: "Commanding the toolchain.",
      content: "Orchestrate your generation workflow with powerful CLI flags.",
      subsections: [
        {
          title: "Basic Commands",
          code: {
            language: "bash",
            snippet: "# Generate all targets\nnpx tsx src/cli.ts examples/app.dsl.ts generated/output --targets=backend,frontend\n\n# Backend only mode\nnpx tsx src/cli.ts examples/app.dsl.ts generated/output --mode=backend"
          }
        },
        {
          title: "Policy Overrides",
          content: "Override DSL settings directly from the terminal.",
          code: {
            language: "bash",
            snippet: "npx tsx src/cli.ts examples/app.dsl.ts --policies='{\"backend\":{\"generateId\":\"uuid_v4\"}}'"
          }
        }
      ]
    }
  ]
};

/**
 * Standalone Documentation Site
 */
frontend("irgen Docs", {
  pwa: { enabled: true, name: "irgen Docs", shortName: "IRDocs", startUrl: "/", scope: "/" }
}, (app) => {

  // Dynamically generate pages from DOCS_DATA
  DOCS_DATA.sections.forEach(section => {
    app.page(section.title, {
      path: section.id === "intro" ? "/" : "/" + section.id,
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
        if (section.features) {
          c.features(section.features);
        }
        if (section.code) {
          c.code(section.code.snippet, section.code.language);
        }
      });

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
