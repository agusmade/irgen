import path from "node:path";
import { pathToFileURL } from "node:url";
import { app } from "./dsl/runtime.js";
import { frontend } from "./dsl/frontend-runtime.js";
import { aggregateDecls } from "./dsl/aggregator.js";
import { registerBuiltins, runMapper, listMappers } from "./mappers/index.js";
import { engine as loweringEngine } from "./lowering/engine.js";
import { emitterEngine } from "./emit/engine.js";
import { getEmitterForTarget } from "./emit/registry.js";
import { createExtensionContext, ExtensionContext } from "./extensions/context.js";

type Extension = (ctx: ExtensionContext, options?: any) => void | Promise<void>;
type ExtensionConfig = Extension | [Extension, any];

export type CodegenOptions = {
  extensions?: ExtensionConfig[];
};

export type GenerateOptions = {
  entries: string[];
  targets?: string[];
  outDir?: string;
  policies?: Record<string, any>;
  emitterMap?: Record<string, string>;
};

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
          } catch {
            // ignore optional emitters
          }
        }
      }
    }
    await walk(new URL("./emit/", import.meta.url));
  } catch {
    // ignore missing emit folder in consumer builds
  }
}

async function ensureTargetTransforms(targets: string[]) {
  if (targets.includes("backend")) {
    await import("./lowering/targets/to-backend.js");
  }
  if (targets.includes("frontend")) {
    await import("./lowering/targets/to-frontend.js");
  }
  if (targets.includes("electron")) {
    await import("./lowering/targets/to-electron.js");
  }
}

function pickPolicy(src: any, target: string) {
  if (!src) return undefined;
  if (src[target]) return src[target];
  const keys = Object.keys(src);
  const looksNamespaced = keys.some(k => ["backend", "frontend", "electron", "cli"].includes(k));
  return looksNamespaced ? undefined : src;
}

export class Codegen {
  private extensions: ExtensionConfig[];
  constructor(opts?: CodegenOptions) {
    this.extensions = opts?.extensions ?? [];
  }

  app = app;
  frontend = frontend;

  private async applyExtensions() {
    if (!this.extensions.length) return;
    const ctx = createExtensionContext();
    for (const ext of this.extensions) {
      const fn = Array.isArray(ext) ? ext[0] : ext;
      const options = Array.isArray(ext) ? ext[1] : undefined;
      await fn(ctx, options);
    }
  }

  async generate(options: GenerateOptions) {
    const targets = options.targets ?? ["backend"];
    const outDir = options.outDir ?? "generated";
    const prefer = targets.some(t => t === "frontend" || t === "electron") ? "frontend" : "backend";

    registerBuiltins();
    await this.applyExtensions();
    await importAllEmitters();
    await ensureTargetTransforms(targets);

    const unified = await aggregateDecls(options.entries, { prefer });
    const bundlePolicies = (unified as any)?.meta?.policies;

    const results: Record<string, any> = {};
    for (const target of targets) {
      const fromDsl = pickPolicy(bundlePolicies, target);
      const fromOpts = pickPolicy(options.policies, target);
      const mergedPolicies = fromDsl && fromOpts ? { ...fromDsl, ...fromOpts } : fromOpts ?? fromDsl;

      const domainIr = await runMapper(target, unified, mergedPolicies);
      const transformName = `${target}-target`;
      const ir = loweringEngine.getTransform(transformName)
        ? await loweringEngine.runTransform(transformName, domainIr, mergedPolicies)
        : domainIr;
      results[target] = ir;

      const chosenEmitter =
        options.emitterMap?.[target] ??
        getEmitterForTarget(target) ??
        (target === "backend" ? "backend-tsmorph" : target === "frontend" ? "frontend-tsmorph" : target === "electron" ? "electron-shell" : null);

      if (chosenEmitter) {
        const multiple = targets.length > 1;
        const targetOutDir = multiple ? path.resolve(process.cwd(), outDir, target) : path.resolve(process.cwd(), outDir);
        await emitterEngine.runEmitter(chosenEmitter, ir, targetOutDir);
      }
    }

    return { decl: unified, ir: results };
  }
}

export { createExtensionContext, listMappers, runMapper, registerBuiltins };
export { app, frontend };
export type { ExtensionContext } from "./extensions/context.js";

// helper for CLI-like extension loading
export async function loadExtensionModule(modPath: string, ctx?: ExtensionContext) {
  const abs = path.isAbsolute(modPath) ? modPath : path.resolve(process.cwd(), modPath);
  const modUrl = pathToFileURL(abs).href;
  const imported = await import(modUrl);
  const fn = (imported.default ?? imported.extension ?? imported) as Extension;
  if (!ctx) ctx = createExtensionContext();
  if (typeof fn === "function") {
    await fn(ctx, imported.options ?? undefined);
  }
}
