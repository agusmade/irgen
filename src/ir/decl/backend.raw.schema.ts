import { z } from "zod";

/**
 * Backend DeclIR (hasil tangkapan DSL) — dekat dengan DSL backend.
 * Schemas + types untuk deklaratif backend.
 */

export const DeclOperationSchema = z.object({
  kind: z.enum(["create", "get", "list", "update", "remove"]),
  name: z.string().min(1).optional(),
});

export const DeclEntitySchema = z.object({
  type: z.literal("entity"),
  name: z.string().min(1).optional(),
  id: z.string().min(1),
  plural: z.string().optional(),
  model: z.record(z.string()).optional(),
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

