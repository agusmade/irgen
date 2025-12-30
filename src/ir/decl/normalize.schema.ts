import { z } from "zod";
import { DeclAppSchema } from "./backend.raw.schema.js";
import { DeclFrontendAppSchema } from "./frontend.raw.schema.js";
import { DeclCliAppSchema } from "./cli.raw.schema.js";
import type { DeclBundle } from "./bundle.js";
import { pluralize } from "../../utils/string.js";

export const DeclBundleMetaSchema = z.object({
  policies: z.record(z.any()).optional(),
  targets: z.array(z.string()).optional(),
  outDir: z.string().optional(),
}).passthrough();

export const DeclBundleSchema = z.object({
  apps: z.array(z.union([DeclAppSchema, DeclFrontendAppSchema, DeclCliAppSchema])),
  meta: DeclBundleMetaSchema.optional(),
}).strict();

export function validateAndNormalizeBundle(d: unknown): DeclBundle {
  const parsed = DeclBundleSchema.parse(d);

  const normalized: DeclBundle = {
    apps: parsed.apps.map(app => {
      if (app.type === "app") return normalizeBackendApp(app);
      if (app.type === "frontend") return normalizeFrontendApp(app);
      if (app.type === "cli") return normalizeCliApp(app);
      return app as any;
    }),
    meta: parsed.meta,
  };

  return normalized;
}

function normalizeBackendApp(app: any) {
  return {
    ...app,
    entities: app.entities.map((entity: any) => ({
      ...entity,
      plural: entity.plural || pluralize(entity.name || ""),
      operations: normalizeOperations(entity.operations || []),
      id: entity.id,
      name: entity.name ?? entity.id,
    })),
  };
}

function normalizeFrontendApp(app: any) {
  // Frontend decl already has defaults via Zod; keep as passthrough for future normalization hooks.
  return app;
}

function normalizeCliApp(app: any) {
  return app;
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
