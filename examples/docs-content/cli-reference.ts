import type { DocSection } from "./types.js";

export const cliReferenceSection: DocSection = {
  id: "cli-reference",
  title: "CLI Reference",
  subtitle: "Flags, modes, and common workflows.",
  description: "Essential CLI options for running irgen from the terminal.",
  content: [
    {
      type: "paragraph",
      text: [
        "The CLI orchestrates mapping, lowering, and emitters. Use flags to select",
        "targets, override policies, and inspect output.",
      ].join(" "),
    },
    {
      type: "code",
      language: "bash",
      snippet: [
        "irgen examples/app.dsl.ts --targets=backend,frontend --outDir=generated/fullstack",
        "irgen examples/docs.dsl.ts --targets=static-site --outDir=generated/static-docs",
      ].join("\n"),
    },
    {
      type: "section",
      title: "Core Flags",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Use --targets to select outputs, --mode to force domain mapping, and --outDir",
            "to control output location.",
          ].join(" "),
        },
        {
          type: "code",
          language: "bash",
          snippet: [
            "irgen examples/app.dsl.ts --targets=backend",
            "irgen examples/frontend.dsl.ts --mode=frontend --outDir=generated/frontend",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Policies and Extensions",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Override policies via --policies and load extensions with --ext. The CLI",
            "supports .ts extension modules via the tsx loader, and can also resolve",
            "installed npm packages by name.",
          ].join(" "),
        },
        {
          type: "code",
          language: "bash",
          snippet: [
            "irgen examples/app.dsl.ts --targets=backend --policies='{\"backend\":{\"core\":{\"generateId\":\"uuid_v4\"}}}'",
            "irgen examples/app.dsl.ts --targets=backend --ext=./ext/my-ext.ts",
            "irgen examples/app.dsl.ts --targets=backend --ext=irgen-ext-php-shared-hosting",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Emitter Introspection",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Use --emitters to list emitters or --emitter to run a specific one.",
          ].join(" "),
        },
        {
          type: "code",
          language: "bash",
          snippet: [
            "irgen --emitters",
            "irgen examples/app.dsl.ts --emitter=backend-tsmorph",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Debugging IR",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Inspect intermediate structures with --inspect-decl and --inspect-ir.",
          ].join(" "),
        },
        {
          type: "code",
          language: "bash",
          snippet: [
            "irgen examples/app.dsl.ts --targets=backend --inspect-decl",
            "irgen examples/app.dsl.ts --targets=backend --inspect-ir",
          ].join("\n"),
        },
      ],
    },
    {
      type: "section",
      title: "Output Layout",
      blocks: [
        {
          type: "paragraph",
          text: [
            "When multiple targets are requested, output is grouped by target under",
            "the chosen outDir. Single target output goes directly to outDir.",
          ].join(" "),
        },
      ],
    },
    {
      type: "calloutLinks",
      links: [
        { label: "See Install & CLI", href: "/docs/install-cli/" },
        { label: "See DSL Reference", href: "/docs/dsl-reference/" },
      ],
    },
  ],
};
