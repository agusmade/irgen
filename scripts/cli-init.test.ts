
import prompts from "prompts";
import { runInit } from "../src/cli/init.js";
import fs from "node:fs";
import path from "node:path";
import { assert } from "node:console";

const TEST_PROJECT_NAME = "test-project-automated";
const TEST_DIR = path.resolve(process.cwd(), TEST_PROJECT_NAME);

async function runTest() {
    console.log(`Running automated test for 'irgen init' in ${TEST_DIR}...`);

    // Cleanup potential leftover
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }

    // Inject inputs:
    // 1. Project Name: "test-project-automated" (if prompted, but we'll pass it as arg to skip)
    // 2. Template: "backend" (value: "backend")
    // Note: If we pass the name as arg, the first prompt is skipped.
    // The 'prompts' library consumes injected values for active prompts.
    // If we pass args[0], 'projectName' prompt type is null (skipped).
    // So 'backend' should be the answer for 'template'.
    prompts.inject(["backend"]);

    try {
        // Run init with project name argument
        await runInit([TEST_PROJECT_NAME]);

        // Verification
        console.log("Verifying generated files...");

        const checkFile = (relPath: string) => {
            const p = path.join(TEST_DIR, relPath);
            if (!fs.existsSync(p)) {
                throw new Error(`Missing expected file: ${relPath}`);
            }
        };

        const checkNoFile = (relPath: string) => {
            const p = path.join(TEST_DIR, relPath);
            if (fs.existsSync(p)) {
                throw new Error(`Unexpected file exists: ${relPath}`);
            }
        };

        // Common files
        checkFile("package.json");
        checkFile("tsconfig.json");
        checkFile("src/ir/target/backend.policy.ts");
        checkFile("examples/app.dsl.ts");

        // Backend template specific
        checkNoFile("src/ir/target/frontend.policy.ts");

        // Check package.json scripts
        const pkg = JSON.parse(fs.readFileSync(path.join(TEST_DIR, "package.json"), "utf-8"));
        if (pkg.scripts["gen:frontend"]) {
            throw new Error("package.json should not have gen:frontend script for backend template");
        }
        if (!pkg.scripts["gen:backend"]) {
            throw new Error("package.json missing gen:backend script");
        }

        console.log("SUCCESS: 'irgen init' test passed.");

    } catch (err) {
        console.error("FAILED: 'irgen init' test failed.", err);
        process.exit(1);
    } finally {
        // Cleanup
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, { recursive: true, force: true });
            console.log("Cleanup done.");
        }
    }
}

runTest();
