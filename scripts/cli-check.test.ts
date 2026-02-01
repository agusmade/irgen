
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const CLI = "npx tsx src/cli.ts";
const TMP_DIR = path.resolve("test-dsl-check");

function createDsl(name: string, content: string) {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
    const dslPath = path.resolve("src/index.js"); // Exported from root index
    const contentWithAbsImport = content.replace(/"\.\.\/src\/dsl\/index\.js"/g, `"${dslPath}"`);
    fs.writeFileSync(path.join(TMP_DIR, name), contentWithAbsImport);
    return path.join(TMP_DIR, name);
}

function runCheck(file: string): { status: number, output: string } {
    try {
        const output = execSync(`${CLI} check ${file}`, { stdio: "pipe" }).toString();
        return { status: 0, output };
    } catch (err: any) {
        return { status: err.status, output: err.stdout.toString() + err.stderr.toString() };
    }
}

async function test() {
    console.log("Running automated tests for 'irgen check'...");
    let failures = 0;

    try {
        // 1. Valid DSL (Backend + Frontend)
        const validBackend = createDsl("valid-backend.dsl.ts", `
      import { app } from "../src/dsl/runtime.js";
      app("ValidBackend", (t) => {
        t.entity("User", (e) => { e.model({ name: "string" }); });
      });
    `);
        const validFrontend = createDsl("valid-frontend.dsl.ts", `
      import { frontend } from "../src/dsl/frontend-runtime.js";
      frontend("ValidFrontend", (f) => {
        // Define shared component
        f.component("Header", (c) => {});
        f.page("Home", { path: "/" }, (p) => { 
            p.component("Header"); // Referencing shared component
            p.component("UserList", (c) => { c.entityRef = "User"; }); 
        });
      });
    `);
        // Check them together
        const validRes = runCheck(`${validBackend} ${validFrontend}`);
        if (validRes.status !== 0) {
            console.error("FAIL: Valid DSL should exit 0. Output:", validRes.output);
            failures++;
        } else {
            console.log("PASS: Valid DSL");
        }

        // 2. Invalid Entity Ref
        const invalidEntityRef = createDsl("invalid-entity.dsl.ts", `
      import { frontend } from "../src/dsl/frontend-runtime.js";
      frontend("InvalidEntity", (f) => {
        f.component("UserList", (c) => { c.entityRef = "UnknownUser"; });
      });
    `);
        const invEntityRes = runCheck(invalidEntityRef);
        if (invEntityRes.status === 0 || !invEntityRes.output.includes("references unknown Entity")) {
            console.error("FAIL: Should detect unknown Entity ref. Output:", invEntityRes.output);
            failures++;
        } else {
            console.log("PASS: Detects unknown Entity ref");
        }

        // 3. Duplicate Page Paths
        const dupPage = createDsl("dup-page.dsl.ts", `
        import { frontend } from "../src/dsl/frontend-runtime.js";
        frontend("DupPage", (f) => {
            f.page("Home1", { path: "/" });
            f.page("Home2", { path: "/" });
        });
    `);
        const dupPageRes = runCheck(dupPage);
        if (dupPageRes.status !== 0 || !dupPageRes.output.includes("Duplicate Page path")) {
            // Warning doesn't cause exit code 1 unless I changed it.
            // In src/cli/check.ts: if (hasError) exit 1 else exit 0
            // Duplicate page path is a WARNING.
            if (!dupPageRes.output.includes("Duplicate Page path")) {
                console.error("FAIL: Should detect duplicate Page path warning. Output:", dupPageRes.output);
                failures++;
            } else {
                console.log("PASS: Detects duplicate Page path warning");
            }
        } else {
            console.log("PASS: Detects duplicate Page path (exit 0 as expected for warning)");
        }


        // 4. Duplicate Entity names (Across two files)
        const ent1 = createDsl("ent1.dsl.ts", `import { app } from "../src/dsl/runtime.js"; app("A", (t)=>{t.entity("User", ()=>{})});`);
        const ent2 = createDsl("ent2.dsl.ts", `import { app } from "../src/dsl/runtime.js"; app("B", (t)=>{t.entity("User", ()=>{})});`);

        const dupRes = runCheck(`${ent1} ${ent2}`);
        if (dupRes.status === 0 || !dupRes.output.includes("Duplicate Entity name")) {
            console.error("FAIL: Should detect duplicate Entity name. Output:", dupRes.output);
            failures++;
        } else {
            console.log("PASS: Detects duplicate Entity name");
        }


    } catch (e) {
        console.error("Unexpected error:", e);
        failures++;
    } finally {
        fs.rmSync(TMP_DIR, { recursive: true, force: true });
    }

    if (failures > 0) process.exit(1);
    console.log("All checks passed.");
}

test();
