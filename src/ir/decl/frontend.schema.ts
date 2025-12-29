import { z } from "zod";

const LogicExprSchema: z.ZodType<any> = z.union([z.string(), z.record(z.any()), z.array(z.any())]);

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
    "time",
    "url",
    "phone",
    "file",
    "slider",
    "currency",
    "tags",
    "signature",
    "daterange",
    "email",
    "password",
  ]),
  label: z.string().optional(),
  validators: z.object({
    required: z.boolean().optional(),
    requiredIf: LogicExprSchema.optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    format: z.enum(["email", "url"]).optional(),
    equalsField: z.string().optional(),
    notEqualsField: z.string().optional(),
    greaterThanField: z.string().optional(),
    lessThanField: z.string().optional(),
    custom: z.array(z.object({
      logic: LogicExprSchema,
      message: z.string().optional(),
    })).optional(),
    uniqueIn: z.array(z.string()).optional(),
  }).optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  dataSource: z.object({
    url: z.string(),
    labelKey: z.string(),
    valueKey: z.string(),
    searchParam: z.string().optional(),
    pageParam: z.string().optional(),
    pageSizeParam: z.string().optional(),
    pageSize: z.number().optional(),
    debounceMs: z.number().optional(),
  }).optional(),
  visibleIf: LogicExprSchema.optional(),
  disabledIf: LogicExprSchema.optional(),
  defaultValue: LogicExprSchema.optional(),
  computeValue: LogicExprSchema.optional(),
  multiple: z.boolean().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  tooltip: z.string().optional(),
  searchPlaceholder: z.string().optional(),
  clearable: z.boolean().optional(),
  ariaLabel: z.string().optional(),
  accept: z.string().optional(),
  step: z.number().optional(),
  defaultCurrency: z.string().optional(),
  helpHtml: z.string().optional(),
  className: z.string().optional(),
});

export const DeclFormSchema = z.object({
  fields: z.array(DeclFieldSchema).default([]),
  submit: z.object({
    url: z.string().url().optional(),
    method: z.enum(["POST", "PUT", "PATCH"]).optional(),
    successMessage: z.string().optional(),
    errorMessage: z.string().optional(),
    confirmMessage: z.string().optional(),
    beforeSubmit: LogicExprSchema.optional(),
    afterSubmit: LogicExprSchema.optional(),
    onSuccess: LogicExprSchema.optional(),
    onError: LogicExprSchema.optional(),
    redirect: z.string().optional(),
    draftKey: z.string().optional(),
  }).optional(),
});

export const DeclComponentSchema = z.object({
  type: z.literal("component"),
  name: z.string().min(1),
  props: z.record(z.string()).optional(),
  form: DeclFormSchema.optional(),
  entityRef: z.string().optional(),
  layout: z.object({
    kind: z.enum(["row", "column", "panel", "tabs"]),
    title: z.string().optional(),
    columns: z.number().min(1).max(4).optional(),
    items: z.array(z.string()).optional(),
    tabs: z.array(z.object({
      label: z.string(),
      content: z.string().optional(),
      items: z.array(z.string()).optional(),
    })).optional(),
  }).optional(),
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

