import type { DeclUnified } from "../ir/decl";
import type { BackendIR } from "../ir/domain/backend.js";
import type { FrontendIR } from "../ir/domain/frontend.js";

type MapperFn = (decl: DeclUnified) => Promise<any> | any;

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

export async function runMapper(name: string, decl: DeclUnified) {
  const fn = getMapper(name);
  if (!fn) throw new Error(`mapper not registered: ${name}`);
  return await fn(decl);
}

// Register the known mappers lazily to avoid circular imports in other modules
export function registerBuiltins() {
  if (listMappers().length > 0) return; // idempotent

  // These imports are dynamic to avoid top-level circular deps
  const backend = async (decl: DeclUnified): Promise<BackendIR> => {
    const mod = await import("../lowering/backend.js");
    const backendApp = decl.apps.find(app => app.type === "app");
    if (!backendApp) throw new Error("no backend app found in unified declaration");
    return mod.declToBackendIR(backendApp as any);
  };

  const frontend = async (decl: DeclUnified): Promise<FrontendIR> => {
    const mod = await import("../lowering/frontend.js");
    const frontendApp = decl.apps.find(app => app.type === "frontend");
    if (!frontendApp) throw new Error("no frontend app found in unified declaration");
    return mod.declToFrontendIR(frontendApp as any);
  };

  registerMapper("backend", backend, { force: true });
  registerMapper("frontend", frontend, { force: true });
}
