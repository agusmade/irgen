import { z } from "zod";

/**
 * DeclFronted: DSL-facing shapes for frontend definitions.
 * FrontendIR: domain-specific for frontend emitter.
 */

export const DeclFieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    "text",
    "number",
    "select",
    "textarea",
    "checkbox",
    "radio",
    "date",
    "datetime",
    "email",
    "password",
  ]),
  label: z.string().optional(),
  // basic validation rules (minLength, required, etc)
  validators: z.object({
    required: z.boolean().optional(),
    requiredIf: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
  // Expanded
  placeholder: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  dataSource: z.object({ url: z.string(), labelKey: z.string(), valueKey: z.string() }).optional(),
  visibleIf: z.string().optional(),
  disabledIf: z.string().optional(),
  defaultValue: z.string().optional(),
  computeValue: z.string().optional(),
  multiple: z.boolean().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  tooltip: z.string().optional(),
  searchPlaceholder: z.string().optional(),
});

export const DeclFormSchema = z.object({
  fields: z.array(DeclFieldSchema).default([]),
  submit: z.object({
    url: z.string().url().optional(),
    method: z.enum(["POST", "PUT", "PATCH"]).optional(),
    successMessage: z.string().optional(),
    errorMessage: z.string().optional(),
  }).optional(),
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
  // optional layout configuration
  layout: z.object({
    kind: z.enum(["row", "column", "panel", "tabs"]),
    title: z.string().optional(),
    columns: z.number().min(1).max(4).optional(),
    items: z.array(z.string()).optional(),
    tabs: z.array(z.object({
      label: z.string(),
      content: z.string().optional(),
    })).optional(),
  }).optional(),
  // non-form content/button helpers
  content: z.string().optional(),
  html: z.string().optional(),
  button: z.object({
    label: z.string(),
    variant: z.enum(["primary", "secondary", "ghost"]).optional(),
    icon: z.string().optional(),
  }).optional(),
});

export const DeclPageSchema = z.object({
  type: z.literal("page"),
  name: z.string().min(1),
  path: z.string().min(1),
  components: z.array(DeclComponentSchema).default([]),
});

const DeclPwaIconSchema = z.object({
  src: z.string().min(1),
  sizes: z.string().min(1),
  type: z.string().min(1).default("image/png"),
  purpose: z.string().optional(),
});

export const DeclPwaConfigSchema = z.object({
  enabled: z.boolean().default(false),
  name: z.string().optional(),
  shortName: z.string().optional(),
  description: z.string().optional(),
  startUrl: z.string().optional(),
  scope: z.string().optional(),
  display: z.string().optional(),
  backgroundColor: z.string().optional(),
  themeColor: z.string().optional(),
  orientation: z.string().optional(),
  icons: z.array(DeclPwaIconSchema).optional(),
});

export const DeclFrontendAppSchema = z.object({
  type: z.literal("frontend"),
  name: z.string().min(1),
  pages: z.array(DeclPageSchema).default([]),
  components: z.array(DeclComponentSchema).default([]),
  pwa: DeclPwaConfigSchema.optional(),
});

export type DeclComponent = z.infer<typeof DeclComponentSchema>;
export type DeclPage = z.infer<typeof DeclPageSchema>;
export type DeclFrontendApp = z.infer<typeof DeclFrontendAppSchema>;

// FrontendIR (lowered)
export interface FrontendField {
  name: string;
  type: string;
  label?: string;
  validators?: Record<string, any>;
  // Expanded properties
  placeholder?: string;
  description?: string;
  icon?: string;
  options?: { label: string; value: string }[];
  dataSource?: { url: string; labelKey: string; valueKey: string };
  visibleIf?: string;
  disabledIf?: string;
  defaultValue?: string;
  computeValue?: string;
}

export interface FrontendForm {
  fields: FrontendField[];
  submit?: {
    url?: string;
    method?: "POST" | "PUT" | "PATCH";
    successMessage?: string;
    errorMessage?: string;
  };
}

export interface FrontendComponent {
  name: string;
  props?: Record<string, string>;
  form?: FrontendForm;
  entityRef?: string;
  layout?: {
    kind: "row" | "column" | "panel" | "tabs";
    title?: string;
    columns?: number;
    items?: string[];
    tabs?: { label: string; content?: string }[];
  };
  content?: string;
  html?: string;
  button?: { label: string; variant?: "primary" | "secondary" | "ghost"; icon?: string };
}

export interface FrontendPage {
  name: string;
  path: string;
  components: FrontendComponent[];
}

export interface FrontendPwaIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface FrontendPwaConfig {
  enabled: boolean;
  name: string;
  shortName: string;
  description?: string;
  startUrl: string;
  scope: string;
  display: string;
  backgroundColor: string;
  themeColor: string;
  orientation?: string;
  icons?: FrontendPwaIcon[];
}

export interface FrontendIR {
  domain: "frontend";
  appName: string;
  pages: FrontendPage[];
  components: FrontendComponent[];
  pwa?: FrontendPwaConfig;
}
