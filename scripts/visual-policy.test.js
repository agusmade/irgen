import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DSL_FILE = "examples/visual-contracts.dsl.ts";
const OUT_DIR = "generated-visual-test";

function main() {
    console.log(`Running visual policy test using ${DSL_FILE}...`);

    if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true, force: true });

    try {
        execSync(`npx tsx src/cli.ts ${DSL_FILE} ${OUT_DIR} --mode=frontend`, { stdio: "inherit" });
    } catch (err) {
        console.error("CLI execution failed");
        process.exit(1);
    }

    const appFile = path.join(OUT_DIR, "src", "App.tsx");
    const content = fs.readFileSync(appFile, "utf-8");

    let errors = 0;

    const assertions = [
        { cond: content.includes('const visualNavLayout = "sidebar"'), msg: "navLayout policy not applied" },
        { cond: content.includes('const visualContentWidth = "narrow"'), msg: "contentWidth policy not applied" },
        { cond: content.includes('const visualDensity = "spacious"'), msg: "density policy not applied" },
        { cond: content.includes('"CustomLogo"'), msg: "brand logoText not applied" },
        { cond: content.includes('"Custom Footer Text"'), msg: "footer text not applied" },
        { cond: content.includes('"Custom Nav Section"'), msg: "navSection copy not applied" },
        { cond: content.includes('"Custom Footer Default"'), msg: "footerDefault copy not applied" },
        { cond: content.includes('"SearchIcon"'), msg: "search icon override not applied" },
        { cond: content.includes('"src":"https://example.com/me.png"'), msg: "avatar src data not found in App.tsx" },
        { cond: content.includes('"search","avatar"'), msg: "topbarItems data not found in App.tsx" },
        { cond: content.includes('"sidebarWidth":"w-80"'), msg: "sidebarWidth breakpoint data not found in App.tsx" },
    ];

    for (const a of assertions) {
        if (!a.cond) {
            console.error(`FAILED: ${a.msg}`);
            errors++;
        }
    }

    // Check component classes
    const formFile = path.join(OUT_DIR, "src", "components", "main-form.tsx");
    const formContent = fs.readFileSync(formFile, "utf-8");
    if (!formContent.includes("custom-input-class")) {
        console.error("FAILED: form inputClass not applied in main-form.tsx");
        errors++;
    }
    if (!formContent.includes("custom-button-class")) {
        console.error("FAILED: form buttonClass not applied in main-form.tsx");
        errors++;
    }

    const tableFile = path.join(OUT_DIR, "src", "components", "main-table.tsx");
    const tableContent = fs.readFileSync(tableFile, "utf-8");
    if (!tableContent.includes("custom-row-class")) {
        console.error("FAILED: table rowClass not applied in main-table.tsx");
        errors++;
    }

    if (errors > 0) {
        console.error(`Visual policy test failed with ${errors} errors.`);
        process.exit(1);
    } else {
        console.log("Visual policy test passed!");
        process.exit(0);
    }
}

main();
