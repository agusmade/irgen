import { z } from "zod";
import { DeclAppSchema } from "./decl.js";
import type { DeclUnified } from "./decl-unified.js";
import { pluralize } from "../utils/index.js";

export const DeclUnifiedSchema = z.object({
  apps: z.array(DeclAppSchema),
});

export function validateDeclUnified(d: unknown): DeclUnified {
  const parsed = DeclUnifiedSchema.parse(d);

  // normalization: ensure each entity has plural set and operations normalized
  for (const app of parsed.apps) {
    for (const e of app.entities) {
      if (!e.plural || e.plural.length === 0) {
        e.plural = pluralize(e.name);
      }

      // normalize operation names and ensure unique names
      const seen = new Set<string>();
      e.operations = e.operations.map(op => {
        const kind = op.kind.toLowerCase();
        const name = op.name ?? kind;
        const finalName = name;
        if (seen.has(finalName)) {
          // append suffix to make unique
          let i = 2;
          let candidate = `${finalName}_${i}`;
          while (seen.has(candidate)) i++, (candidate = `${finalName}_${i}`);
          seen.add(candidate);
          return { ...op, name: candidate };
        }
        seen.add(finalName);
        return { ...op, name: finalName };
      });

      // ensure id (identifier used in entity) exists
      if (!e.id || e.id.length === 0) {
        e.id = e.name.toLowerCase();
      }
    }
  }

  return parsed as DeclUnified;
}
