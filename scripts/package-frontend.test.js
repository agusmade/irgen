import { aggregateDecls } from "../src/decl/aggregator.js";
import { engine } from "../src/lowering/engine.js";
import { emitterEngine } from "../src/emit/engine.js";
import fs from "node:fs";
import path from "node:path";

async function main() {
  try {
    const unified = await aggregateDecls(["examples/app.dsl.ts"]);
    const decl = unified.apps[0];

    await import("../src/lowering/backend.js");
    const outDir = path.resolve(process.cwd(), "generated-frontend-package-test");
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

    // note: app.dsl.ts enables frontend.meta { react: true, tailwind: true }
    const backendIR = await engine.runTransform("backend", decl, { generateId: "uuid_v4" });

    await import("../src/emit/backend-tsmorph.js");
    await emitterEngine.runEmitter("backend-tsmorph", backendIR, outDir);

    const pkgFile = path.join(outDir, "package.json");
    if (!fs.existsSync(pkgFile)) throw new Error("package.json not generated");

    const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf-8"));
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};

    if (!deps.react) throw new Error("expected react dependency for frontend-enabled app");
    if (!deps["react-dom"]) throw new Error("expected react-dom dependency for frontend-enabled app");
    if (!devDeps.tailwindcss) throw new Error("expected tailwindcss devDependency when tailwind enabled");

    if (!pkg.scripts || !pkg.scripts["build:css"]) throw new Error("expected build:css script when tailwind enabled");

    console.log("Frontend package test passed");
    process.exit(0);
  } catch (err) {
    console.error("Frontend package test failed:", err);
    process.exit(1);
  }
}

main();
