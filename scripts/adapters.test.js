import { aggregateDecls } from "../src/dsl/aggregator.js";
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
    await import("../src/emit/backend/backend-tsmorph.js");

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

    if (!fs.existsSync(httpFile)) throw new Error("http.ts not generated");

    // Test Health Adapter (basic check)
    // We didn't enable health in the default run above, so let's run a quick targeted emit or just check it's NOT there by default?
    // Actually, let's run a second pass with health enabled to verify it generates.

    console.log("Running second pass with health policy enabled...");
    const healthOutDir = path.resolve(process.cwd(), "generated-adapters-health-test");
    if (fs.existsSync(healthOutDir)) fs.rmSync(healthOutDir, { recursive: true, force: true });

    // transform with health policy
    const healthIR = await engine.runTransform("backend", decl, {
      health: { enabled: true, endpoint: "/health" },
      logging: { enabled: true, level: "info" }
    });

    await emitterEngine.runEmitter("backend-tsmorph", healthIR, healthOutDir);

    const healthFile = path.join(healthOutDir, "lib", "health.ts");
    if (!fs.existsSync(healthFile)) throw new Error("health.ts not generated when policy enabled");

    const healthContent = fs.readFileSync(healthFile, "utf-8");
    if (!healthContent.includes("export async function healthCheck")) throw new Error("health.ts missing healthCheck");

    console.log("Adapters test passed");
    process.exit(0);
  } catch (err) {
    console.error("Adapters test failed:", err);
    process.exit(1);
  }
}

main();
