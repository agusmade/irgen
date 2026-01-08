import { loadDsl } from "./runtime.js";
import { loadFrontendDsl } from "./frontend-runtime.js";
import { DeclBundle, asBundle, validateAndNormalizeBundle, DeclBundleMeta } from "../ir/decl/index.js";

/**
 * Minimal aggregator: load DSL entries and merge them into a DeclBundle.
 */

export async function aggregateDecls(entries: string[], opts?: { prefer?: "frontend" | "backend" }): Promise<DeclBundle> {
  const loaded: Array<{ app: any; meta?: DeclBundleMeta }> = [];

  for (const e of entries) {
    const attempts: Array<() => Promise<any>> = [];

    const preferFrontend = opts?.prefer === "frontend" || e.includes("frontend");
    if (preferFrontend) {
      attempts.push(() => loadFrontendDsl(e));
      attempts.push(() => loadDsl(e));
    } else {
      attempts.push(() => loadDsl(e));
      attempts.push(() => loadFrontendDsl(e));
    }

    let loadedDecl: any | null = null;
    let lastError: any = null;
    for (const attempt of attempts) {
      try {
        loadedDecl = await attempt();
        break;
      } catch (err) {
        lastError = err;
        // try next loader; keep noisy logging minimal
        continue;
      }
    }

    if (!loadedDecl) {
      const msg = lastError instanceof Error ? lastError.message : String(lastError ?? "unknown error");
      throw new Error(`Failed to load DSL entry "${e}": ${msg}`);
    }

    loaded.push({ app: loadedDecl, meta: loadedDecl?.meta });
  }

  const mergedMeta = mergeMeta(loaded.map(l => l.meta));
  const unified = asBundle(loaded.map(l => l.app) as any, mergedMeta);
  return validateAndNormalizeBundle(unified as any);
}

function mergeMeta(metas: Array<DeclBundleMeta | undefined>): DeclBundleMeta | undefined {
  const finalMeta: DeclBundleMeta = {};

  for (const meta of metas) {
    if (!meta) continue;

    if (meta.policies) {
      finalMeta.policies = finalMeta.policies ?? {};
      for (const [target, policy] of Object.entries(meta.policies)) {
        const existing = finalMeta.policies[target] ?? {};
        finalMeta.policies[target] = { ...existing, ...(policy as any) };
      }
    }

    for (const [k, v] of Object.entries(meta)) {
      if (k === "policies") continue;
      if (finalMeta[k] === undefined) finalMeta[k] = v;
    }
  }

  return Object.keys(finalMeta).length ? finalMeta : undefined;
}
