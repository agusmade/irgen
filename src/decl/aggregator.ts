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
    if (e.includes("frontend")) {
      // try frontend loader, but fall back to backend loader for resilience in POC
      try {
        const f = await loadFrontendDsl(e);
        loaded.push(f);
      } catch (err) {
        console.warn("frontend DSL load failed, falling back to generic DSL loader:", e, err?.message ?? err);
        try {
          const b = await loadDsl(e);
          loaded.push(b);
        } catch (err2) {
          console.warn("generic DSL loader also failed for:", e, err2?.message ?? err2);
          // skip this entry for POC resilience
        }
      }
    } else {
      const b = await loadDsl(e);
      loaded.push(b);
    }
  }

  const unified = mergeIntoUnified(loaded as any);
  // validate + normalize
  return validateAndNormalizeDeclUnified(unified as any);
}
