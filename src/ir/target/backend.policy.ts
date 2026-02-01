import { z } from "zod";

// Interfaces (REST v1; placeholders for future transports)
export const BackendInterfaceRestPolicySchema = z.object({
  enabled: z.boolean().default(true),
  basePath: z.string().min(1).default("/api"),
  openapi: z.object({
    enabled: z.boolean().default(true),
    title: z.string().min(1).default("API"),
    version: z.string().min(1).default("1.0.0"),
    serverUrl: z.string().min(1).optional(),
  }).default({}),
  publicRoutes: z.array(z.string().min(1)).default([]),
}).default({});

export const BackendInterfacesPolicySchema = z.object({
  rest: BackendInterfaceRestPolicySchema,
}).default({});

// Envelope v1
export const BackendEnvelopePolicySchema = z.object({
  type: z.enum(["standard_v1"]).default("standard_v1"),
  keys: z.object({
    data: z.string().default("data"),
    meta: z.string().default("meta"),
    error: z.string().default("error"),
  }).default({}),
  meta: z.object({
    requestIdKey: z.string().default("requestId"),
  }).default({}),
  errorShape: z.object({
    codeKey: z.string().default("code"),
    messageKey: z.string().default("message"),
    detailsKey: z.string().default("details"),
  }).default({}),
}).default({});

// Pagination v1: page/limit
export const BackendPaginationPolicySchema = z.object({
  type: z.enum(["page_limit"]).default("page_limit"),
  defaults: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).default(20),
    maxLimit: z.number().int().min(1).default(100),
  }).default({}),
  meta: z.object({
    pageKey: z.string().default("page"),
    limitKey: z.string().default("limit"),
    totalKey: z.string().default("total"),
    hasNextKey: z.string().default("hasNext"),
  }).default({}),
}).default({});

// Auth v1: JWT
export const BackendAuthJwtPolicySchema = z.object({
  enabled: z.boolean().default(true),
  algorithm: z.enum(["HS256", "RS256"]).default("HS256"),
  secret: z.string().min(16).optional().default("CHANGE_ME_SUPER_SECRET_MIN_16_CHARS"),
  jwksUrl: z.string().url().optional(),
  issuer: z.string().min(1).optional(),
  audience: z.string().min(1).optional(),
  clockToleranceSec: z.number().int().min(0).default(30),
  claims: z.object({
    subjectKey: z.string().default("sub"),
    rolesKey: z.string().default("roles"),
  }).default({}),
}).superRefine((v, ctx) => {
  if (!v.enabled) return;
  if (v.algorithm === "HS256") {
    if (!v.secret) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "backend.auth.jwt.secret wajib untuk HS256", path: ["secret"] });
    }
    if (v.jwksUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "backend.auth.jwt.jwksUrl tidak dipakai untuk HS256", path: ["jwksUrl"] });
    }
  }
  if (v.algorithm === "RS256") {
    if (!v.jwksUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "backend.auth.jwt.jwksUrl wajib untuk RS256", path: ["jwksUrl"] });
    }
    if (v.secret) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "backend.auth.jwt.secret tidak dipakai untuk RS256", path: ["secret"] });
    }
  }
}).default({});

export const BackendAuthPolicySchema = z.object({
  jwt: BackendAuthJwtPolicySchema,
}).default({});

// Core knobs (kept for compatibility with existing backend policies)
export const BackendCorePolicySchema = z.object({
  generateId: z.enum(["uuid_v4", "shortid", "custom"]).default("uuid_v4"),
  loggerImpl: z.enum(["console", "pino", "winston", "custom"]).default("console"),
  httpClient: z.enum(["fetch", "axios", "got", "custom"]).default("fetch"),
  formatter: z.enum(["prettier", "biome"]).default("prettier"),
  db: z.object({
    provider: z.literal("prisma"),
    url: z.string(),
  }).optional(),
}).default({});

// Logging v1 (Pino-based)
export const BackendLoggingPolicySchema = z.object({
  enabled: z.boolean().default(true),
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  format: z.enum(["json", "pretty"]).default("json"),
  redact: z.array(z.string().min(1)).default(["password", "token", "secret", "authorization"]),
}).default({});

export const BackendHealthPolicySchema = z.object({
  enabled: z.boolean().default(true),
  endpoint: z.string().default("/health"),
  metrics: z.object({
    enabled: z.boolean().default(false),
    endpoint: z.string().default("/metrics"),
  }).default({}),
}).default({});

export const BackendPolicySchema = z.object({
  interfaces: BackendInterfacesPolicySchema,
  envelope: BackendEnvelopePolicySchema,
  pagination: BackendPaginationPolicySchema,
  auth: BackendAuthPolicySchema,
  logging: BackendLoggingPolicySchema,
  health: BackendHealthPolicySchema,
  core: BackendCorePolicySchema,
}).default({});

export type BackendPolicy = z.infer<typeof BackendPolicySchema>;

export function normalizeBackendPolicy(input: unknown): BackendPolicy {
  return BackendPolicySchema.parse(input);
}
