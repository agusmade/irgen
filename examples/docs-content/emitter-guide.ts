import type { DocSection } from "./types.js";

export const emitterGuideSection: DocSection = {
    id: "emitter-development",
    title: "Emitter Development",
    subtitle: "Extension guide for irgen contributors.",
    description: "Learn how to build new emitters and extend the irgen pipeline.",
    content: [
        {
            type: "paragraph",
            text: [
                "Building an emitter for irgen involves understanding the transition from",
                "Target-Agnostic IR to Target-Specific code. This guide walks you through",
                "the internal pipeline and the best practices for code emission."
            ].join(" "),
        },
        {
            type: "section",
            title: "The IR Pipeline",
            blocks: [
                {
                    type: "paragraph",
                    text: [
                        "1. **DeclIR**: Captured directly from the DSL (raw intent).",
                        "2. **DomainIR**: Enriched semantic model (e.g., BackendEntity).",
                        "3. **TargetIR**: The final contract for the emitter. It includes resolved policies."
                    ].join("\n"),
                },
                {
                    type: "code",
                    language: "typescript",
                    snippet: `// Example: TargetIR for a Backend Entity
export interface BackendTargetIR {
  appName: string;
  entities: BackendEntity[];
  policies: BackendPolicy; // Fully resolved decisions
}`,
                }
            ],
        },
        {
            type: "section",
            title: "Creating a New Emitter",
            blocks: [
                {
                    type: "paragraph",
                    text: [
                        "To add a new emitter, you need to register it in the Emitter Engine and",
                        "map it to a target in the Registry."
                    ].join(" "),
                },
                {
                    type: "code",
                    language: "typescript",
                    snippet: `import { emitterEngine } from "../engine.js";
import { registerTargetEmitter } from "../registry.js";

async function myCustomEmitter(ir: MyTargetIR, outDir: string) {
  // 1. Traverse IR
  // 2. Generate files (using fs or ts-morph)
}

// Register
emitterEngine.registerEmitter("my-custom", myCustomEmitter);
registerTargetEmitter("my-target", "my-custom");`,
                }
            ],
        },
        {
            type: "section",
            title: "Using the Emitter SDK",
            blocks: [
                {
                    type: "paragraph",
                    text: [
                        "irgen provides a small SDK with common utilities for emitters, such as",
                        "string casing and smart file writing.",
                        "For now this SDK is an internal, blessed utility for built-in emitters,",
                        "not a guaranteed public API for third-party extensions."
                    ].join(" "),
                },
                {
                    type: "code",
                    language: "typescript",
                    snippet: 'import { casing, writeIfChanged } from "../utils/sdk.js";\n\nconst className = casing.pascal(entity.name);\nwriteIfChanged(path.join(outDir, "models", `${casing.kebab(entity.name)}.ts`), content);',
                }
            ],
        },
        {
            type: "section",
            title: "Debugging & Inspection",
            blocks: [
                {
                    type: "paragraph",
                    text: [
                        "Use the CLI flags to inspect the state of the IR at different stages:",
                        "- `--inspect-decl`: See the raw input from DSL.",
                        "- `--inspect-domain`: See the enriched semantic model.",
                        "- `--inspect-ir`: See the final contract sent to the emitter."
                    ].join("\n"),
                }
            ],
        },
        {
            type: "section",
            title: "Emitter Discipline",
            blocks: [
                {
                    type: "paragraph",
                    text: [
                        "Emitters should be 'dumb'. All architectural decisions (like which DB provider",
                        "to use or what naming convention to follow) should be resolved in the",
                        "**Lowering** phase and encoded into the **TargetIR**. If your emitter is",
                        "making a decision, that logic likely belongs in a Policy and a Lowering step."
                    ].join(" "),
                }
            ],
        },
        {
            type: "calloutLinks",
            links: [
                { label: "View Architecture", href: "/docs/architecture" },
                { label: "See Policy Reference", href: "/docs/policy-reference" }
            ],
        }
    ],
};
