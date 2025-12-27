import { aggregateDecls } from "../src/decl/aggregator.js";
import { emitterEngine } from "../src/emit/engine.js";
import fs from "node:fs";
import path from "node:path";
import { engine } from "../src/lowering/engine.js";

async function main() {
  try {
    const unified = await aggregateDecls(["examples/app.dsl.ts"]);
    const decl = unified.apps[0];
    const outDir = path.resolve(process.cwd(), "generated-adapters-test");
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

    // make sure lowering transforms are registered
    await import("../src/lowering/backend.js");

    // run lowering with policies
    const backendIR = await engine.runTransform("backend", decl, { generateId: "shortid", loggerImpl: "console", httpClient: "fetch" });

    // ensure emitters are registered
    await import("../src/emit/backend-tsmorph.js");

    await emitterEngine.runEmitter("backend-tsmorph", backendIR, outDir);

    const idFile = path.join(outDir, "lib", "id.ts");
    const loggerFile = path.join(outDir, "lib", "logger.ts");
    const httpFile = path.join(outDir, "lib", "http.ts");

    if (!fs.existsSync(idFile)) throw new Error("id.ts not generated");
    if (!fs.existsSync(loggerFile)) throw new Error("logger.ts not generated");
    if (!fs.existsSync(httpFile)) throw new Error("http.ts not generated");

    const loggerContent = fs.readFileSync(loggerFile, "utf-8");
    if (!loggerContent.includes("Generated: logger adapter (console)")) throw new Error("logger adapter content mismatch");

    const httpContent = fs.readFileSync(httpFile, "utf-8");
    if (!httpContent.includes("Generated: http client adapter (fetch)")) throw new Error("http adapter content mismatch");

    console.log("Adapters test passed");
    process.exit(0);
  } catch (err) {
    console.error("Adapters test failed:", err);
    process.exit(1);
  }
}

main();
