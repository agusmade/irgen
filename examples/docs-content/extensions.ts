import type { DocSection } from "./types.js";

export const extensionsSection: DocSection = {
  id: "extensions",
  title: "Extensions",
  subtitle: "Customize mappers, transforms, and emitters.",
  description: "Extensions add capabilities without changing core targets.",
  content: [
    {
      type: "paragraph",
      text: [
        "Extensions register mappers, transforms, emitters, and policy schemas.",
        "They run after built-ins and follow the same deterministic phase order.",
      ].join(" "),
    },
    {
      type: "code",
      language: "typescript",
      snippet: [
        "export default (ctx) => {",
        "  // v0.3.1+: automatically namespaced context",
        "  ctx.logger.info(\"Setting up frontend...\");",
        "  ctx.registerEmitter(\"frontend\", myEmitter);",
        "  ",
        "  // Need to register globally?",
        "  ctx.root.registerTargetEmitter(\"frontend\", \"myExt:frontend\");",
        "};",
      ].join("\n"),
    },
    {
      type: "section",
      title: "Registration Surface",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Extensions can register mappers (DeclBundle -> DomainIR), transforms",
            "(DomainIR -> TargetIR), emitters (TargetIR -> files), and policy schemas.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Phases and Determinism",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Extensions should register hooks only. Avoid side effects at import time",
            "so execution stays deterministic and testable.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Automatic Namespacing",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Since v0.3.1, the CLI automatically wraps your extension function in a",
            "namespaced context. This prevents accidental collisions between different",
            "extensions. A mapper registered as 'foo' in 'my-ext' becomes 'my-ext:foo'.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "The Unified Logger",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Use `ctx.logger` instead of `console.log`. It provides consistent,",
            "color-coded, and namespaced output (`info`, `success`, `warn`, `error`).",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "Root Access",
      blocks: [
        {
          type: "paragraph",
          text: [
            "If your extension absolutely needs to register a target globally or",
            "access core registries without a namespace prefix, use `ctx.root`.",
          ].join(" "),
        },
      ],
    },
    {
      type: "section",
      title: "CLI Usage",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Load extensions with --ext in the CLI. Order matters and follows the",
            "provided list. You can point to a file path or an installed npm package.",
          ].join(" "),
        },
        {
          type: "code",
          language: "bash",
          snippet: [
            "npx irgen --targets=frontend --ext=./ext/my-ext.ts examples/app.dsl.ts",
            "npx irgen --targets=frontend --ext=irgen-ext-php-shared-hosting examples/app.dsl.ts",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Programmatic Usage",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Extensions can also be loaded through the Codegen API for controlled",
            "integration in scripts or tests.",
          ].join(" "),
        },
        {
          type: "code",
          language: "typescript",
          snippet: [
            "import { Codegen } from \"irgen\";",
            "import myExt from \"./my-ext.js\";",
            "",
            "const cg = new Codegen({ extensions: [myExt] });",
            "await cg.generate({ entries: [\"./app.dsl.ts\"], targets: [\"frontend\"] });",
          ].join("\n"),
        },
      ],
    },
  ],
};
