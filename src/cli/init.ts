
import prompts from "prompts";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export async function runInit(args: string[]) {
    const extFlags = args.filter(a => a.startsWith("--ext="));
    const extModules = extFlags.flatMap(f => f.replace("--ext=", "").split(",")).filter(Boolean);

    if (extModules.length > 0) {
        const { loadExtensions } = await import("./extensions.js");
        await loadExtensions(extModules);
    }

    const { templateRegistry } = await import("./template-registry.js");
    const extTemplates = templateRegistry.getTemplates();

    const defaultName = args.find(a => !a.startsWith("-")) || "my-irgen-app";

    const response = await prompts([
        {
            type: (args.find(a => !a.startsWith("-"))) ? null : "text",
            name: "projectName",
            message: "Project name:",
            initial: defaultName
        },
        {
            type: "select",
            name: "template",
            message: "Select a startup template:",
            choices: [
                { title: "Fullstack (Backend + Frontend)", value: "fullstack" },
                { title: "Backend Only", value: "backend" },
                { title: "Frontend Only", value: "frontend" },
                ...extTemplates.map(t => ({ title: t.title, value: t.id }))
            ],
            initial: 0
        }
    ]);

    const projectName = response.projectName || defaultName;
    const template = response.template || "fullstack";
    const projectDir = path.resolve(process.cwd(), projectName);

    if (fs.existsSync(projectDir)) {
        console.error(`Error: Directory ${projectName} already exists.`);
        process.exit(1);
    }

    // Handle extension templates
    const extTemplate = templateRegistry.getTemplate(template);
    if (extTemplate) {
        console.log(`\nScaffolding project in ${projectDir} using template ${extTemplate.title}...`);
        fs.mkdirSync(projectDir, { recursive: true });
        await extTemplate.generate(projectDir, response);
        console.log("\nDone!");
        return;
    }

    console.log(`\nScaffolding project in ${projectDir}...`);
    fs.mkdirSync(projectDir, { recursive: true });

    // 1. package.json
    const pkgJson = {
        name: projectName,
        version: "0.0.1",
        type: "module",
        scripts: {
            "gen": "irgen examples/app.dsl.ts --mode=combined",
            "gen:backend": "irgen examples/app.dsl.ts --mode=backend",
            "gen:frontend": "irgen examples/app.dsl.ts --mode=frontend",
        },
        dependencies: {
            "irgen": "latest" // In a real scenario this would be the actual version
        },
        devDependencies: {
            "typescript": "^5.0.0",
            "tsx": "^4.0.0"
        }
    };

    if (template === "backend") {
        if (pkgJson.scripts["gen:frontend"]) delete (pkgJson.scripts as any)["gen:frontend"];
        pkgJson.scripts["gen"] = "irgen examples/app.dsl.ts --mode=backend";
    } else if (template === "frontend") {
        if (pkgJson.scripts["gen:backend"]) delete (pkgJson.scripts as any)["gen:backend"];
        pkgJson.scripts["gen"] = "irgen examples/app.dsl.ts --mode=frontend";
    }

    fs.writeFileSync(path.join(projectDir, "package.json"), JSON.stringify(pkgJson, null, 2));

    // 2. tsconfig.json
    const tsConfig = {
        compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
            skipLibCheck: true,
            outDir: "dist"
        },
        include: ["src/**/*", "examples/**/*"]
    };
    fs.writeFileSync(path.join(projectDir, "tsconfig.json"), JSON.stringify(tsConfig, null, 2));

    // 3. Create folder structure
    ensureDir(path.join(projectDir, "src", "ir", "target"));
    ensureDir(path.join(projectDir, "examples"));

    // 4. Default Policies
    const policyContent = (type: string) => `
import { ${type}Policy } from "irgen";

export const My${type}Policy = ${type}Policy({
  // Add policy overrides here
});
`.trim();

    if (template !== "frontend") {
        fs.writeFileSync(path.join(projectDir, "src/ir/target/backend.policy.ts"), policyContent("Backend"));
    }
    if (template !== "backend") {
        fs.writeFileSync(path.join(projectDir, "src/ir/target/frontend.policy.ts"), policyContent("Frontend"));
    }

    // 5. Example DSL
    let dslContent = `import { app } from "irgen";\n\napp("${projectName}", (t) => {\n`;
    if (template !== "frontend") {
        dslContent += `  t.entity("User", (e) => {\n    e.field("email", "string", { unique: true });\n  });\n`;
    }
    if (template !== "backend") {
        dslContent += `  t.page("Home", { path: "/" }, (p) => {\n    p.component("Welcome");\n  });\n`;
    }
    dslContent += `});\n`;

    fs.writeFileSync(path.join(projectDir, "examples/app.dsl.ts"), dslContent);

    console.log("\nDone! Now run:\n");
    console.log(`  cd ${projectName}`);
    console.log("  npm install");
    console.log("  npm run gen");
}

function ensureDir(p: string) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
