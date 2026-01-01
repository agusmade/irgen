import path from "node:path";
import { pathToFileURL } from "node:url";
import { aggregateDecls } from "./dsl/aggregator.js";
import { registerBuiltins, runMapper } from "./mappers/index.js";

// Guard: require a modern Node (tsx/TS output uses optional chaining/nullish coalescing)
const NODE_MAJOR = Number(process.versions.node.split(".")[0]);
if (Number.isFinite(NODE_MAJOR) && NODE_MAJOR < 16) {
  console.error(`ir-codegen requires Node.js >=16 (detected ${process.versions.node}). Please switch to a newer Node before running the CLI.`);
  process.exit(1);
}

async function main() {
  const modeFlag = process.argv.find(a => a.startsWith("--mode=")) ?? "--mode=backend";
  const mode = modeFlag.split("=")[1];

  // Additional flags: --emitters (list emitters), --emitter=<name> (run one emitter)
  const showEmitters = process.argv.includes("--emitters");
  const emitterFlag = process.argv.find(a => a.startsWith("--emitter=")) ?? null;
  const emitterName = emitterFlag ? emitterFlag.split("=")[1] : null;

  // parse positional args: first DSL entry and optional outDir
  const rawArgs = process.argv.slice(2);
  const extFlags = rawArgs.filter(a => a.startsWith("--ext="));
  const extModules = extFlags.flatMap(f => f.replace("--ext=", "").split(",")).filter(Boolean);
  const outDirFlag = process.argv.find(a => a.startsWith("--outDir=")) ?? null;
  const entries = rawArgs.filter(a => a.endsWith(".dsl.ts"));
  const entry = entries[0];
  const entryIndex = entry ? rawArgs.indexOf(entry) : -1;
  const maybeOut = entryIndex >= 0 ? rawArgs[entryIndex + 1] : undefined;

  // Logic: Explicit flag > Positional arg (if valid) > Default
  const outDir = outDirFlag
    ? outDirFlag.split("=")[1]
    : (maybeOut && !maybeOut.startsWith("--") ? maybeOut : "generated");

  // helper: import all emit modules so they can register themselves
  async function importAllEmitters() {
    try {
      const fs = await import("node:fs/promises");
      async function walk(dir: URL) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.isDirectory()) {
            await walk(new URL(`./${ent.name}/`, dir));
          } else if (ent.name.endsWith(".js") || ent.name.endsWith(".ts")) {
            try {
              await import(new URL(`./${ent.name}`, dir).href);
            } catch (e) {
              // ignore import errors for optional files
            }
          }
        }
      }

      await walk(new URL("./emit/", import.meta.url));
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

  const targetsFlag = process.argv.find(a => a.startsWith("--targets=")) ?? null;
  const targetsFromFlag = targetsFlag ? targetsFlag.split("=")[1].split(",").map(t => t.trim()).filter(Boolean) : null;
  const normalizeModeToTargets = (m: string): string[] => {
    if (targetsFromFlag && targetsFromFlag.length > 0) return targetsFromFlag;
    if (m === "combined") return ["backend", "frontend"];
    if (m === "frontend" || m === "backend" || m === "electron") return [m];
    if (m === "electrobun") return ["electrobun"];
    return ["backend"];
  };
  const targets = normalizeModeToTargets(mode);

  const defaultEntry = entry
    ?? ((targets.includes("frontend") || targets.includes("electron") || targets.includes("electrobun"))
      ? "examples/frontend.dsl.ts"
      : "examples/app.dsl.ts");
  // normalise entries array (fallback to example DSL when not provided)
  const entriesArr = entries.length ? entries : [defaultEntry];

  const inspectIR = process.argv.includes("--inspect-ir");
  const inspectDecl = process.argv.includes("--inspect-decl");
  const policiesFlag = process.argv.find(a => a.startsWith("--policies=")) ?? null;
  const policiesFromCli = policiesFlag ? JSON.parse(policiesFlag.split("=")[1]) : undefined;
  const emitterMapFlag = process.argv.find(a => a.startsWith("--emitter-map=")) ?? null;
  const emitterMap = emitterMapFlag ? JSON.parse(emitterMapFlag.split("=")[1]) : undefined;

  // Aggregate all entries into DeclUnified (validation/normalization inside)
  const prefer = targets.some(t => t === "frontend" || t === "electron" || t === "electrobun") ? "frontend" : "backend";
  const unified = await aggregateDecls(entriesArr, { prefer });
  if (inspectDecl) console.log("INSPECT-DECL:", JSON.stringify(unified, null, 2));

  // ensure built-in mappers are available before extensions register/compose
  registerBuiltins();

  async function loadExtensions() {
    if (!extModules.length) return;
    const { createExtensionContext } = await import("./extensions/context.js");
    const ctx = createExtensionContext();
    for (const modPath of extModules) {
      const abs = path.isAbsolute(modPath) ? modPath : path.resolve(process.cwd(), modPath);
      const modUrl = pathToFileURL(abs).href;
      const imported = await import(modUrl);
      const fn = (imported.default ?? imported.extension ?? imported);
      if (typeof fn === "function") {
        fn(ctx, imported.options ?? undefined);
      } else {
        console.warn(`extension module ${modPath} did not export a function`);
      }
    }
  }

  await loadExtensions();

  const bundlePolicies = (unified as any)?.meta?.policies;
  const pickPolicy = (src: any, target: string) => {
    if (!src) return undefined;
    if (src[target]) return src[target];
    const keys = Object.keys(src);
    const looksNamespaced = keys.some(k => ["backend", "frontend", "electron", "cli"].includes(k));
    return looksNamespaced ? undefined : src;
  };
  const policyForTarget = (target: string) => {
    const fromDsl = pickPolicy(bundlePolicies, target);
    const fromCli = pickPolicy(policiesFromCli, target);
    if (fromDsl && fromCli) return { ...fromDsl, ...fromCli };
    return fromCli ?? fromDsl;
  };

  // ensure emitters and transforms are registered
  await importAllEmitters();

  // ensure target lowering transforms are registered when available
  if (targets.includes("backend")) await import("./lowering/targets/to-backend.js");
  if (targets.includes("frontend")) await import("./lowering/targets/to-frontend.js");
  if (targets.includes("electron")) await import("./lowering/targets/to-electron.js");

  const { engine } = await import("./lowering/engine.js");
  const { emitterEngine } = await import("./emit/engine.js");
  const { getEmitterForTarget } = await import("./emit/registry.js");

  const singleTargetOutDir = (target: string) => {
    const multipleTargets = targets.length > 1;
    return multipleTargets ? path.resolve(process.cwd(), outDir, target) : path.resolve(process.cwd(), outDir);
  };

  if (emitterName) {
    if (!emitterEngine.getEmitter(emitterName)) {
      throw new Error(`emitter not registered: ${emitterName}`);
    }

    // infer mode if user didn't pass --mode
    let chosenMode = mode;
    if (!process.argv.find(a => a.startsWith("--mode="))) {
      if (emitterName.includes("backend")) chosenMode = "backend";
      else if (emitterName.includes("frontend")) chosenMode = "frontend";
    }

    const domainIr = await runMapper(chosenMode, unified, policyForTarget(chosenMode));
    const transformName = `${chosenMode}-target`;
    const targetIr = engine.getTransform(transformName)
      ? await engine.runTransform(transformName, domainIr, policyForTarget(chosenMode))
      : domainIr;
    if (inspectIR) console.log(`INSPECT-IR (${chosenMode}):`, JSON.stringify(targetIr, null, 2));
    await emitterEngine.runEmitter(emitterName, targetIr, singleTargetOutDir(chosenMode));
    console.log(`Ran emitter ${emitterName} (${chosenMode}) -> ${outDir}`);
    process.exit(0);
  }

  for (const target of targets) {
    let ir: any;
    try {
      const domainIr = await runMapper(target, unified, policyForTarget(target));
      const transformName = `${target}-target`;
      ir = engine.getTransform(transformName)
        ? await engine.runTransform(transformName, domainIr, policyForTarget(target))
        : domainIr;
    } catch (err) {
      console.error(`failed to map target ${target}:`, err);
      continue;
    }
    if (inspectIR) console.log(`INSPECT-IR (${target}):`, JSON.stringify(ir, null, 2));

    const chosenEmitter =
      (emitterMap?.[target]) ??
      getEmitterForTarget(target) ??
      (target === "backend" ? "backend-tsmorph" : target === "frontend" ? "frontend-tsmorph" : target === "electron" ? "electron-shell" : null);

    if (!chosenEmitter) {
      console.warn(`no emitter mapping for target ${target}, skipping emit`);
      continue;
    }

    await emitterEngine.runEmitter(chosenEmitter, ir, singleTargetOutDir(target));
  }

  console.log("OK");
  console.log("MODE:", process.argv.find(a => a.startsWith("--mode=")) ? mode : "(auto)");
  console.log("TARGETS:", targets.join(", "));
  console.log("DSL :", entriesArr.join(", "));
  console.log("OUT :", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
