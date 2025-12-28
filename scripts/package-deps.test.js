import { aggregateDecls } from "../src/decl/aggregator.js";
import { engine } from "../src/lowering/engine.js";
import { emitterEngine } from "../src/emit/engine.js";
import fs from "node:fs";
import path from "node:path";

async function main() {
  try {
    const unified = await aggregateDecls(["examples/app.dsl.ts"]);
    const decl = unified.apps[0];

    // ensure backend lowering is loaded
    await import("../src/lowering/backend.js");

    const outDir = path.resolve(process.cwd(), "generated-package-test");
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

    const backendIR = await engine.runTransform("backend", decl, { generateId: "uuid_v4", loggerImpl: "pino", httpClient: "axios" });

    // ensure emitter registered
    await import("../src/emit/backend/backend-tsmorph.js");

    await emitterEngine.runEmitter("backend-tsmorph", backendIR, outDir);

    const pkgFile = path.join(outDir, "package.json");
    if (!fs.existsSync(pkgFile)) throw new Error("package.json not generated");

    const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf-8"));
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};
    if (!deps.uuid) throw new Error("expected uuid dependency when generateId=uuid_v4");
    if (!deps.axios) throw new Error("expected axios dependency when httpClient=axios");
    if (!deps.pino) throw new Error("expected pino dependency when loggerImpl=pino");
    if (deps.react || deps["react-dom"]) throw new Error("frontend deps should not be present in backend-only package");
    if (devDeps.tailwindcss) throw new Error("tailwindcss should not be added to backend-only package");

    console.log("Package deps test passed");
    process.exit(0);
  } catch (err) {
    console.error("Package deps test failed:", err);
    process.exit(1);
  }
}

main();
