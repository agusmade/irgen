import type { DocSection } from "./types.js";

export const cliReferenceSection: DocSection = {
  id: "cli-reference",
  title: "CLI Reference",
  subtitle: "Flags, modes, and common workflows.",
  description: "Essential CLI options for running irgen from the terminal.",
  content: [
    "The CLI orchestrates mapping, lowering, and emitters. Use flags to select",
    "targets, override policies, and inspect output.",
  ].join(" "),
  code: {
    language: "bash",
    snippet: [
      "irgen examples/app.dsl.ts --targets=backend,frontend --outDir=generated/fullstack",
      "irgen examples/docs.dsl.ts --targets=static-site --outDir=generated/static-docs",
    ].join("\n"),
  },
  subsections: [
    {
      title: "Core Flags",
      content: [
        "`--targets` to select outputs, `--mode` to force domain mapping, and",
        "`--outDir` for output location.",
      ].join(" "),
      code: {
        language: "bash",
        snippet: [
          "irgen examples/app.dsl.ts --targets=backend",
          "irgen examples/frontend.dsl.ts --mode=frontend --outDir=generated/frontend",
        ].join("\n"),
      },
    },
    {
      title: "Policies and Extensions",
      content: [
        "Override policies via `--policies` and load extensions with `--ext`.",
        "Extensions can be .ts files.",
      ].join(" "),
      code: {
        language: "bash",
        snippet: [
          "irgen examples/app.dsl.ts --targets=backend --policies='{\"backend\":{\"core\":{\"generateId\":\"uuid_v4\"}}}'",
          "irgen examples/app.dsl.ts --targets=backend --ext=./ext/my-ext.ts",
        ].join("\n"),
      },
    },
    {
      title: "Emitter Introspection",
      content: [
        "Use `--emitters` to list emitters or `--emitter` to run a specific one.",
      ].join(" "),
      code: {
        language: "bash",
        snippet: [
          "irgen --emitters",
          "irgen examples/app.dsl.ts --emitter=backend-tsmorph",
        ].join("\n"),
      },
    },
    {
      title: "Debugging IR",
      content: [
        "Inspect intermediate structures with `--inspect-decl` and `--inspect-ir`.",
      ].join(" "),
      code: {
        language: "bash",
        snippet: [
          "irgen examples/app.dsl.ts --targets=backend --inspect-decl",
          "irgen examples/app.dsl.ts --targets=backend --inspect-ir",
        ].join("\n"),
      },
    },
  ],
};
