import path from "node:path";
import { loadDsl } from "./dsl/runtime.js";
import { declToBackendIR } from "./lowering/backend.js";
import { emitBackend } from "./emit/backend/backend-tsmorph.js";
import { loadFrontendDsl } from "./dsl/frontend-runtime.js";
import { declToFrontendIR } from "./lowering/frontend.js";
import { emitFrontend as emitFrontendFromIR } from "./emit/frontend/frontend-react.js";

async function main() {
  const modeFlag = process.argv.find(a => a.startsWith("--mode=")) ?? "--mode=backend";
  const mode = modeFlag.split("=")[1];

  // Additional flags: --emitters (list emitters), --emitter=<name> (run one emitter)
  const showEmitters = process.argv.includes("--emitters");
  const emitterFlag = process.argv.find(a => a.startsWith("--emitter=")) ?? null;
  const emitterName = emitterFlag ? emitterFlag.split("=")[1] : null;

  // parse positional args: first DSL entry and optional outDir
  // parse positional args: first DSL entry and optional outDir
  const rawArgs = process.argv.slice(2);
  const outDirFlag = process.argv.find(a => a.startsWith("--outDir=")) ?? null;
  const entries = rawArgs.filter(a => a.endsWith('.dsl.ts'));
  const entry = entries[0]; // ?? (mode === 'frontend' ? 'examples/frontend.dsl.ts' : 'examples/app.dsl.ts');
  const entryIndex = rawArgs.indexOf(entry);
  const maybeOut = rawArgs[entryIndex + 1];

  // Logic: Explicit flag > Positional arg (if valid) > Default
  const outDir = outDirFlag
    ? outDirFlag.split("=")[1]
    : (maybeOut && !maybeOut.startsWith('--') ? maybeOut : 'generated');
  const entryArgIndex = entryIndex; // keep for later logging
  // normalise entries array
  const entriesArr = entries.length ? entries : [entry];

  // helper: import all emit modules so they can register themselves
  async function importAllEmitters() {
    try {
      const fs = await import("node:fs/promises");
      const dir = new URL("./emit", import.meta.url);
      const files = await fs.readdir(dir);
      for (const f of files) {
        if (f.endsWith(".js") || f.endsWith(".ts")) {
          try {
            await import(`./emit/${f}`);
          } catch (e) {
            // ignore import errors for optional files
          }
        }
      }
    } catch (e) {
      // ignore errors when emit directory is missing
    }
  }

  if (showEmitters) {
    await importAllEmitters();
    const { emitterEngine } = await import("./emit/engine.js");
    console.log("Registered emitters:", emitterEngine.listEmitters().join(", "));
    process.exit(0);
  }

  if (emitterName) {
    await importAllEmitters();
    const { emitterEngine } = await import("./emit/engine.js");
    if (!emitterEngine.getEmitter(emitterName)) {
      throw new Error(`emitter not registered: ${emitterName}`);
    }

    // infer mode if user didn't pass --mode
    let chosenMode = mode;
    if (!process.argv.find(a => a.startsWith("--mode="))) {
      if (emitterName.includes("backend")) chosenMode = "backend";
      else if (emitterName.includes("frontend")) chosenMode = "frontend";
    }

    if (chosenMode === "backend") {
      const decl = await loadDsl(entry);
      const backendIR = declToBackendIR(decl);
      await emitterEngine.runEmitter(emitterName, backendIR, path.resolve(process.cwd(), outDir));
      console.log(`Ran emitter ${emitterName} (backend) -> ${outDir}`);
      process.exit(0);
    } else if (chosenMode === "frontend") {
      const decl = await loadFrontendDsl(entry);
      const frontendIR = declToFrontendIR(decl);
      await emitterEngine.runEmitter(emitterName, frontendIR, path.resolve(process.cwd(), outDir));
      console.log(`Ran emitter ${emitterName} (frontend) -> ${outDir}`);
      process.exit(0);
    } else {
      throw new Error(`unable to determine mode for emitter ${emitterName}, pass --mode=backend|frontend`);
    }
  }

  // orchestration: --targets=backend,frontend and --inspect-ir to print IRs
  const targetsFlag = process.argv.find(a => a.startsWith("--targets=")) ?? null;
  const targets = targetsFlag ? targetsFlag.split("=")[1].split(",").map(t => t.trim()).filter(Boolean) : null;
  const inspectIR = process.argv.includes("--inspect-ir");
  const inspectDecl = process.argv.includes("--inspect-decl");
  const policiesFlag = process.argv.find(a => a.startsWith("--policies=")) ?? null;
  const policies = policiesFlag ? JSON.parse(policiesFlag.split("=")[1]) : undefined;
  const emitterMapFlag = process.argv.find(a => a.startsWith("--emitter-map=")) ?? null;
  const emitterMap = emitterMapFlag ? JSON.parse(emitterMapFlag.split("=")[1]) : undefined;
  const policyForTarget = (target: string) => {
    if (!policies) return undefined;
    if (policies[target]) return policies[target];
    const keys = Object.keys(policies);
    const looksNamespaced = keys.some(k => ["backend", "frontend"].includes(k));
    return looksNamespaced ? undefined : policies;
  };

  if (targets && targets.length > 0) {
    // orchestrate: load decls per target
    let decl: any;
    if (targets.length === 1 && targets[0] === "frontend") {
      decl = await loadFrontendDsl(entry);
    } else if (targets.length === 1 && targets[0] === "backend") {
      decl = await loadDsl(entry);
    } else {
      // aggregate when mixing targets
      const { aggregateDecls } = await import("./decl/aggregator.js");
      const unified = await aggregateDecls([entry]);
      decl = unified.apps[0];
    }

    // optionally inspect the aggregated DeclUnified
    if (inspectDecl && decl) console.log("INSPECT-DECL:", JSON.stringify(decl, null, 2));

    // ensure emitters are imported so they can register themselves (including test/override emitters)
    await importAllEmitters();

    for (const t of targets) {
      if (t === "backend") {
        // ensure backend lowering registered
        await import("./lowering/backend.js");
        const { engine } = await import("./lowering/engine.js");
        const backendIR = await engine.runTransform("backend", decl, policyForTarget("backend"));
        if (inspectIR) console.log("INSPECT-IR (backend):", JSON.stringify(backendIR, null, 2));
        // choose emitter via mapping (CLI override wins)
        const { getEmitterForTarget } = await import("./emit/registry.js");
        const { emitterEngine } = await import("./emit/engine.js");
        const chosenEmitter = emitterMap?.backend ?? getEmitterForTarget("backend") ?? "backend-tsmorph";
        await emitterEngine.runEmitter(chosenEmitter, backendIR, path.resolve(process.cwd(), outDir, "backend"));
      } else if (t === "frontend") {
        // ensure frontend lowering registered
        await import("./lowering/frontend.js");
        const { engine } = await import("./lowering/engine.js");
        const frontendIR = await engine.runTransform("frontend", decl, policyForTarget("frontend"));
        if (inspectIR) console.log("INSPECT-IR (frontend):", JSON.stringify(frontendIR, null, 2));
        const { getEmitterForTarget } = await import("./emit/registry.js");
        const { emitterEngine } = await import("./emit/engine.js");
        const chosenEmitter = emitterMap?.frontend ?? getEmitterForTarget("frontend") ?? "frontend-tsmorph";
        await emitterEngine.runEmitter(chosenEmitter, frontendIR, path.resolve(process.cwd(), outDir, "frontend"));
      } else {
        console.warn(`unknown target: ${t}`);
      }
    }

    console.log("Orchestration complete");
    process.exit(0);
  }

  if (mode === "backend") {
    const decl = await loadDsl(entry);
    const backendIR = declToBackendIR(decl, policyForTarget("backend"));
    const { emitterEngine } = await import("./emit/engine.js");
    await emitterEngine.runEmitter("backend-tsmorph", backendIR, path.resolve(process.cwd(), outDir));
  } else if (mode === "frontend") {
    const decl = await loadFrontendDsl(entry);
    const frontendIR = declToFrontendIR(decl, policyForTarget("frontend"));

    // create a ts-morph project so the frontend emitter can create files and save
    const project = new (await import("ts-morph")).Project({
      useInMemoryFileSystem: false,
      manipulationSettings: {
        quoteKind: (await import("ts-morph")).QuoteKind.Double,
        indentationText: (await import("ts-morph")).IndentationText.TwoSpaces,
      },
      compilerOptions: { target: (await import("ts-morph")).ScriptTarget.ES2022 },
    });

    emitFrontendFromIR(project, path.resolve(process.cwd(), outDir), frontendIR);
    project.saveSync();
  } else if (mode === "combined") {
    // POC combined flow: aggregate decls, run registered mappers and emit both backend and frontend
    const { aggregateDecls } = await import("./decl/aggregator.js");
    const { registerBuiltins, runMapper } = await import("./mappers/index.js");

    registerBuiltins();
    const decl = await aggregateDecls(entries);

    // backend
    try {
      const backendIR = await runMapper("backend", decl);
      emitBackend(backendIR as any, path.resolve(process.cwd(), outDir, "backend"));
    } catch (err) {
      console.error("backend generation failed:", err);
    }

    // frontend
    try {
      const frontendIR = await runMapper("frontend", decl);
      const { emitterEngine } = await import("./emit/engine.js");
      await emitterEngine.runEmitter("frontend-tsmorph", frontendIR, path.resolve(process.cwd(), outDir, "frontend"));
    } catch (err) {
      console.error("frontend generation failed:", err);
    }
  } else {
    throw new Error(`unknown mode: ${mode}`);
  }

  console.log("OK");
  console.log("MODE:", mode);
  console.log("DSL :", entriesArr.join(", "));
  console.log("OUT :", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
