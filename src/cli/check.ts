
import { aggregateDecls } from "../dsl/aggregator.js";
import { validateSemantics } from "../dsl/validator.js";

export async function runCheck(args: string[]) {
    const dslFiles = args.filter(a => a.endsWith(".dsl.ts"));
    if (dslFiles.length === 0) {
        console.error("Usage: irgen check <dsl-file>...");
        process.exit(1);
    }

    console.log(`Checking semantic integrity for: ${dslFiles.join(", ")}...`);

    try {
        const extFlags = args.filter(a => a.startsWith("--ext="));
        const extModules = extFlags.flatMap(f => f.replace("--ext=", "").split(",")).filter(Boolean);
        if (extModules.length > 0) {
            const { loadExtensions } = await import("./extensions.js");
            await loadExtensions(extModules);
        }

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
