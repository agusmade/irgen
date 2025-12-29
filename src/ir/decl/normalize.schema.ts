import { z } from "zod";
import { DeclAppSchema } from "./backend.raw.schema.js";
import { DeclFrontendAppSchema } from "./frontend.schema.js";
import { DeclCliAppSchema } from "./cli.schema.js";
import type { DeclBundle } from "./bundle.js";
import { pluralize } from "../../utils/string.js";

export const DeclBundleSchema = z.object({
  apps: z.array(z.union([DeclAppSchema, DeclFrontendAppSchema, DeclCliAppSchema])),
}).strict();

export function validateAndNormalizeBundle(d: unknown): DeclBundle {
  const parsed = DeclBundleSchema.parse(d);

  const normalized: DeclBundle = {
    apps: parsed.apps.map(app => {
      if (app.type !== "app") return app;

      return {
        ...app,
        entities: app.entities.map(entity => ({
          ...entity,
          plural: entity.plural || pluralize(entity.name || ""),
          operations: normalizeOperations(entity.operations || []),
          id: entity.id,
          name: entity.name ?? entity.id,
        })),
      };
    }),
  };

  return normalized;
}

function normalizeOperations(
  operations: { kind: "create" | "get" | "list" | "update" | "remove"; name?: string }[]
): { kind: "create" | "get" | "list" | "update" | "remove"; name: string }[] {
  const seen = new Set<string>();
  return operations.map(op => {
    const kind = op.kind;
    const name = op.name ?? kind;
    const finalName = name;
    if (seen.has(finalName)) {
      let i = 2;
      let candidate = `${finalName}_${i}`;
      while (seen.has(candidate)) i++, (candidate = `${finalName}_${i}`);
      seen.add(candidate);
      return { ...op, kind, name: candidate };
    }
    seen.add(finalName);
    return { ...op, kind, name: finalName };
  });
}

// Backward-compatibility exports
export const DeclUnifiedSchema = DeclBundleSchema;
export const validateAndNormalizeDeclUnified = validateAndNormalizeBundle;

