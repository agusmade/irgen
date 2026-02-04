
import { aggregateDecls } from "../dsl/aggregator.js";
import { validateSemantics } from "../dsl/validator.js";

export async function runCheck(args: string[]) {
    if (args.includes("--help") || args.includes("-h")) {
        console.log(`
irgen check — Semantic validation for irgen DSL files

Usage:
  irgen check <dsl-file>... [options]

Options:
  --ext=<path>         Load extensions (for extension-specific validation)
  --help, -h           Show this help message

Example:
  npx irgen check app.dsl.ts ui.dsl.ts --ext=irgen-ext-php-shared-hosting
        `);
        return;
    }

    const dslFiles = args.filter(a => a.endsWith(".dsl.ts"));
    if (dslFiles.length === 0) {
        console.error("Usage: irgen check <dsl-file>...");
        process.exit(1);
    }

    console.log(`Checking semantic integrity for: ${dslFiles.join(", ")}...`);

    try {
        const decl = await aggregateDecls(dslFiles);
        const messages = validateSemantics(decl);

        if (messages.length === 0) {
            console.log("✅ No semantic errors found.");
            process.exit(0);
        }

        let hasError = false;
        for (const msg of messages) {
            const icon = msg.type === "error" ? "❌" : "⚠️";
            const loc = msg.location ? ` [${msg.location}]` : "";
            console.log(`${icon} ${msg.type.toUpperCase()}: ${msg.message}${loc}`);
            if (msg.type === "error") {
                hasError = true;
            }
        }

        if (hasError) {
            console.error("\nValidation failed.");
            process.exit(1);
        } else {
            console.log("\nValidation passed (with warnings).");
            process.exit(0);
        }

    } catch (err: any) {
        console.error("Failed to load or validate DSL:", err.message);
        process.exit(1);
    }
}
