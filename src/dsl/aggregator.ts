import { loadDsl } from "./runtime.js";
import { loadFrontendDsl } from "./frontend-runtime.js";
import { DeclBundle, mergeIntoBundle, validateAndNormalizeBundle } from "../ir/decl/index.js";

/**
 * Minimal aggregator: load DSL entries and merge them into a DeclBundle.
 */

export async function aggregateDecls(entries: string[], opts?: { prefer?: "frontend" | "backend" }): Promise<DeclBundle> {
  const loaded: any[] = [];

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
      console.warn("unable to load DSL entry, skipping:", e, lastError instanceof Error ? lastError.message : lastError);
      continue;
    }

    loaded.push(loadedDecl);
  }

  const unified = mergeIntoBundle(loaded as any);
  // validate + normalize
  return validateAndNormalizeBundle(unified as any);
}
