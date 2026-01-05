import type { DocSection } from "./types.js";

export const extensionsSection: DocSection = {
  id: "extensions",
  title: "Extensions",
  subtitle: "Customize mappers, transforms, and emitters.",
  description: "Extensions add capabilities without changing core targets.",
  content: [
    "Extensions register mappers, transforms, emitters, and policy schemas.",
    "They run after built-ins and follow the same deterministic phase order.",
  ].join(" "),
  code: {
    language: "typescript",
    snippet: [
      "export default (ctx) => {",
      "  const ns = ctx.namespace(\"myExt\");",
      "  ns.registerEmitter(\"frontend\", myEmitter);",
      "  ctx.registerTargetEmitter(\"frontend\", \"myExt:frontend\");",
      "};",
    ].join("\n"),
  },
  subsections: [
    {
      title: "Registration Surface",
      content: [
        "Extensions can register mappers (DeclBundle -> DomainIR), transforms",
        "(DomainIR -> TargetIR), emitters (TargetIR -> files), and policy schemas.",
      ].join(" "),
    },
    {
      title: "Phases and Determinism",
      content: [
        "Extensions should register hooks only. Avoid side effects at import time",
        "so execution stays deterministic and testable.",
      ].join(" "),
    },
    {
      title: "Namespacing",
      content: [
        "Use ctx.namespace(\"yourExt\") to avoid collisions and accidental overrides.",
        "Prefer namespaced emitters and explicit target mappings.",
      ].join(" "),
    },
    {
      title: "CLI Usage",
      content: [
        "Load extensions with --ext in the CLI. Order matters and follows the",
        "provided list.",
      ].join(" "),
      code: {
        language: "bash",
        snippet: "npx tsx src/cli.ts --targets=frontend --ext=./ext/my-ext.ts examples/app.dsl.ts",
      },
    },
    {
      title: "Programmatic Usage",
      content: [
        "Extensions can also be loaded through the Codegen API for controlled",
        "integration in scripts or tests.",
      ].join(" "),
      code: {
        language: "typescript",
        snippet: [
          "import { Codegen } from \"irgen\";",
          "import myExt from \"./my-ext.js\";",
          "",
          "const cg = new Codegen({ extensions: [myExt] });",
          "await cg.generate({ entries: [\"./app.dsl.ts\"], targets: [\"frontend\"] });",
        ].join("\n"),
      },
    },
  ],
};
