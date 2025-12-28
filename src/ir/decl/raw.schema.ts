import { z } from "zod";

/**
 * DeclIR (hasil tangkapan DSL) — dekat dengan DSL.
 * Schemas + types untuk IR deklaratif (DSL).
 */

export const DeclOperationSchema = z.object({
  kind: z.enum(["create", "get", "list", "update", "remove"]),
  name: z.string().min(1).optional(),
});

export const DeclEntitySchema = z.object({
  type: z.literal("entity"),
  name: z.string().min(1).optional(),
  id: z.string().min(1),
  // optional explicit plural form; if not provided, the generator will pluralize the name
  plural: z.string().optional(),
  // optional model description: map of property name -> type string (e.g. "id":"string")
  model: z.record(z.string()).optional(),
  // operations may be customized (e.g. method names) via DSL later
  operations: z.array(DeclOperationSchema).default([]),
});

export const DeclAppSchema = z.object({
  type: z.literal("app"),
  name: z.string().min(1).optional(),
  entities: z.array(DeclEntitySchema).default([]),
  meta: z.record(z.any()).default({}),
});

export type DeclOperation = z.infer<typeof DeclOperationSchema>;
export type DeclEntity = z.infer<typeof DeclEntitySchema>;

export type DeclApp = z.infer<typeof DeclAppSchema>;
