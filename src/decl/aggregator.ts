import { loadDsl } from "../dsl/runtime.js";
import { loadFrontendDsl } from "../dsl/frontend-runtime.js";
import { DeclUnified, mergeIntoUnified, validateAndNormalizeDeclUnified } from "../ir/decl";

/**
 * Minimal aggregator for the POC: load one or two DSL entries and merge
 * them into a DeclUnified.
 */

export async function aggregateDecls(entries: string[]): Promise<DeclUnified> {
  const loaded: any[] = [];

  for (const e of entries) {
    const attempts: Array<() => Promise<any>> = [];

    // heuristic: if file name hints frontend, try that first
    if (e.includes("frontend")) {
      attempts.push(() => loadFrontendDsl(e));
      attempts.push(() => loadDsl(e));
    } else {
      attempts.push(() => loadDsl(e));
      attempts.push(() => loadFrontendDsl(e));
    }

    let loadedDecl: any | null = null;
    for (const attempt of attempts) {
      try {
        loadedDecl = await attempt();
        break;
      } catch (err) {
        // try next loader; keep noisy logging minimal
        continue;
      }
    }

    if (!loadedDecl) {
      console.warn("unable to load DSL entry, skipping:", e);
      continue;
    }

    loaded.push(loadedDecl);
  }

  const unified = mergeIntoUnified(loaded as any);
  // validate + normalize
  return validateAndNormalizeDeclUnified(unified as any);
}
