import fs from "node:fs";
import path from "node:path";
import { loadFrontendDsl } from "../src/dsl/frontend-runtime.js";
import { engine } from "../src/lowering/engine.js";
import { emitterEngine } from "../src/emit/engine.js";

async function main() {
  try {
    const decl = await loadFrontendDsl("examples/frontend.dsl.ts");
    await import("../src/lowering/frontend.js");

    const outDir = path.resolve(process.cwd(), "generated-frontend-package-test");
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

    const frontendIR = await engine.runTransform("frontend", decl);

    await import("../src/emit/frontend/frontend-react.js");
    await emitterEngine.runEmitter("frontend-tsmorph", frontendIR, outDir);

    const pkgFile = path.join(outDir, "package.json");
    if (!fs.existsSync(pkgFile)) throw new Error("package.json not generated");

    const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf-8"));
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};

    if (!deps.react) throw new Error("expected react dependency for frontend generation");
    if (!deps["react-dom"]) throw new Error("expected react-dom dependency for frontend generation");
    if (!deps["react-router-dom"]) throw new Error("expected react-router-dom dependency for routing");
    if (!devDeps.tailwindcss) throw new Error("expected tailwindcss devDependency for generated Tailwind setup");
    if (!pkg.scripts || !pkg.scripts["build:css"]) throw new Error("expected build:css script for Tailwind output");

    console.log("Frontend package test passed");
    process.exit(0);
  } catch (err) {
    console.error("Frontend package test failed:", err);
    process.exit(1);
  }
}

main();
