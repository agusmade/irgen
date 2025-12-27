import { z } from "zod";

/**
 * DeclFronted: DSL-facing shapes for frontend definitions.
 * FrontendIR: domain-specific for frontend emitter.
 */

export const DeclFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  label: z.string().optional(),
  // basic validation rules (minLength, required, etc)
  validators: z.record(z.any()).optional(),
});

export const DeclFormSchema = z.object({
  fields: z.array(DeclFieldSchema).default([]),
});

export const DeclComponentSchema = z.object({
  type: z.literal("component"),
  name: z.string().min(1),
  // simple prop schema: propName -> type string
  props: z.record(z.string()).optional(),
  // optional structured form spec
  form: DeclFormSchema.optional(),
  // can reference an entity to render (optional)
  entityRef: z.string().optional(),
});

export const DeclPageSchema = z.object({
  type: z.literal("page"),
  name: z.string().min(1),
  path: z.string().min(1),
  components: z.array(DeclComponentSchema).default([]),
});

export const DeclFrontendAppSchema = z.object({
  type: z.literal("frontend"),
  name: z.string().min(1),
  pages: z.array(DeclPageSchema).default([]),
  components: z.array(DeclComponentSchema).default([]),
});

export type DeclComponent = z.infer<typeof DeclComponentSchema>;
export type DeclPage = z.infer<typeof DeclPageSchema>;
export type DeclFrontendApp = z.infer<typeof DeclFrontendAppSchema>;

// FrontendIR (lowered)
export interface FrontendComponent {
  name: string;
  props?: Record<string, string>;
  entityRef?: string;
}

export interface FrontendPage {
  name: string;
  path: string;
  components: FrontendComponent[];
}

export interface FrontendIR {
  domain: "frontend";
  appName: string;
  pages: FrontendPage[];
  components: FrontendComponent[];
}
