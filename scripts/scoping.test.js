import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execFileP = promisify(execFile);

const EXAMPLES = [
    "examples/v022-features.dsl.ts",
    "examples/irgen-web.dsl.ts",
    "examples/fullstack.dsl.ts",
];

const SUSPICIOUS_PATTERNS = [
    // Patterns like ${varName} in the generated code where varName isn't defined in the same file scope
    // These usually indicate the emitter didn't escape the template tag or evaluate the value
    { regex: /\${rowActionIcons/, message: "Found unescaped rowActionIcons reference" },
    { regex: /\${topbarLinksWrapClass/, message: "Found unescaped topbarLinksWrapClass reference" },
    { regex: /\${topbarControlsWrapClass/, message: "Found unescaped topbarControlsWrapClass reference" },
];

async function checkScoping(outDir) {
    const srcDir = path.join(outDir, "src");
    if (!fs.existsSync(srcDir)) {
        console.warn(`    (Skipping frontend scoping check: ${outDir}/src not found)`);
        return 0;
    }

    const files = [];
    function walk(dir) {
        for (const f of fs.readdirSync(dir)) {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) walk(p);
            else if (p.endsWith(".tsx") || p.endsWith(".ts")) files.push(p);
        }
    }
    walk(srcDir);

    let errors = 0;
    for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        for (const pattern of SUSPICIOUS_PATTERNS) {
            if (pattern.regex.test(content)) {
                // Check if the variable is defined with const/let in the same file
                const varName = pattern.regex.source.replace(/\\\${/, "");
                const isDefined = content.includes(`const ${varName}`) || content.includes(`let ${varName}`);

                if (!isDefined) {
                    console.error(`ERROR: ${pattern.message} in ${file} (Variable NOT defined in scope)`);
                    errors++;
                }
            }
        }

        // Check for AST leaks
        if (content.includes("[object Object]")) {
            console.error(`ERROR: Found [object Object] (likely AST leak) in ${file}`);
            errors++;
        }
    }
    return errors;
}

async function main() {
    let totalErrors = 0;
    for (const example of EXAMPLES) {
        console.log(`Checking scoping for ${example}...`);
        const outDir = path.resolve(process.cwd(), "generated-scoping-" + path.basename(example, ".dsl.ts"));
        if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

        try {
            await execFileP(
                "npx",
                ["tsx", "src/cli.ts", example, outDir, "--mode=frontend"],
                { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 },
            );
            totalErrors += await checkScoping(outDir);
        } catch (err) {
            console.error(`Failed to generate ${example}:`, err.message);
            totalErrors++;
        }
    }

    if (totalErrors > 0) {
        console.error(`Scoping verification failed with ${totalErrors} errors.`);
        process.exit(1);
    } else {
        console.log("Scoping verification passed.");
        process.exit(0);
    }
}

main();
