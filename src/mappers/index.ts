import type { DeclUnified } from "../ir/decl";
import type { BackendIR } from "../ir/domain/backend.js";
import type { FrontendIR } from "../ir/domain/frontend.js";

type MapperFn = (decl: DeclUnified, options?: any) => Promise<any> | any;

const registry = new Map<string, MapperFn>();

export function registerMapper(name: string, fn: MapperFn, options?: { force?: boolean }) {
  if (!options?.force && registry.has(name)) {
    throw new Error(`mapper already registered: ${name}`);
  }
  registry.set(name, fn);
}

export function unregisterMapper(name: string) {
  registry.delete(name);
}

export function getMapper(name: string): MapperFn | undefined {
  return registry.get(name);
}

export function listMappers(): string[] {
  return Array.from(registry.keys());
}

export async function runMapper(name: string, decl: DeclUnified, options?: any) {
  const fn = getMapper(name);
  if (!fn) throw new Error(`mapper not registered: ${name}`);
  return await fn(decl, options);
}

// Register the known mappers lazily to avoid circular imports in other modules
export function registerBuiltins() {
  if (listMappers().length > 0) return; // idempotent

  // These imports are dynamic to avoid top-level circular deps
  const backend = async (decl: DeclUnified, policies?: any): Promise<BackendIR> => {
    await import("../lowering/backend.js"); // ensure transform registered
    const { engine } = await import("../lowering/engine.js");
    const backendApp = decl.apps.find(app => app.type === "app");
    if (!backendApp) throw new Error("no backend app found in unified declaration");
    return engine.runTransform("backend", backendApp as any, policies);
  };

  const frontend = async (decl: DeclUnified, policies?: any): Promise<FrontendIR> => {
    await import("../lowering/frontend.js"); // ensure transform registered
    const { engine } = await import("../lowering/engine.js");
    const frontendApp = decl.apps.find(app => app.type === "frontend");
    if (!frontendApp) throw new Error("no frontend app found in unified declaration");
    return engine.runTransform("frontend", frontendApp as any, policies);
  };

  const cli = async (decl: DeclUnified, policies?: any): Promise<any> => {
    await import("../lowering/cli.js");
    const { engine } = await import("../lowering/engine.js");
    const cliApp = decl.apps.find(app => app.type === "cli");
    if (!cliApp) throw new Error("no cli app found in unified declaration");
    return engine.runTransform("cli", cliApp as any, policies);
  };

  registerMapper("backend", backend, { force: true });
  registerMapper("frontend", frontend, { force: true });
  registerMapper("cli", cli, { force: true });
}
