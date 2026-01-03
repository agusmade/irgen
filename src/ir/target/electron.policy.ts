import { z } from "zod";

// Electron Window Policy Schema
export const ElectronWindowPolicySchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  resizable: z.boolean().optional(),
  fullscreen: z.boolean().optional(),
  devTools: z.boolean().optional(),
}).optional();

// Electron Security Policy Schema
export const ElectronSecurityPolicySchema = z.object({
  contextIsolation: z.boolean().optional(),
  sandbox: z.boolean().optional(),
  ipcWhitelist: z.array(z.string()).optional(),
  csp: z.string().optional(),
}).optional();

// Electron Packaging Policy Schema
export const ElectronPackagingPolicySchema = z.object({
  tool: z.literal("electron-builder").optional(),
  appId: z.string().optional(),
  productName: z.string().optional(),
  artifactName: z.string().optional(),
  outputDir: z.string().optional(),
  buildResources: z.string().optional(),
  icon: z.string().optional(),
  asar: z.boolean().optional(),
  extraFiles: z.array(z.string()).optional(),
  extraResources: z.array(z.union([
    z.string(),
    z.object({
      from: z.string(),
      to: z.string().optional(),
    }),
  ])).optional(),
  mac: z.record(z.any()).optional(),
  win: z.record(z.any()).optional(),
  linux: z.record(z.any()).optional(),
}).optional();

// Electron Auto Update Policy Schema
export const ElectronAutoUpdatePolicySchema = z.object({
  enabled: z.boolean().optional(),
  provider: z.enum(["generic", "github", "spaces", "s3"]).optional(),
  url: z.string().optional(),
  channel: z.string().optional(),
  publish: z.record(z.any()).optional(),
  allowPrerelease: z.boolean().optional(),
  requestHeaders: z.record(z.string()).optional(),
  retryOnFail: z.boolean().optional(),
  retryDelayMs: z.number().optional(),
}).optional();

// Electron Reliability Policy Schema
export const ElectronLoggingPolicySchema = z.object({
  enabled: z.boolean().optional(),
  level: z.enum(["error", "warn", "info", "verbose", "debug", "silly"]).optional(),
  fileMaxSizeMB: z.number().optional(),
  console: z.boolean().optional(),
}).optional();

export const ElectronPerformancePolicySchema = z.object({
  disableBackgroundThrottling: z.boolean().optional(),
}).optional();

export const ElectronCrashReportingPolicySchema = z.object({
  enabled: z.boolean().optional(),
  provider: z.enum(["electron", "sentry"]).optional(),
  submitURL: z.string().optional(),
  dsn: z.string().optional(),
  productName: z.string().optional(),
  companyName: z.string().optional(),
  environment: z.string().optional(),
}).optional();

export const ElectronSessionPolicySchema = z.object({
  restoreWindowBounds: z.boolean().optional(),
  windowStateFile: z.string().optional(),
  saveOnClose: z.boolean().optional(),
}).optional();

export const ElectronReliabilityPolicySchema = z.object({
  singleInstance: z.boolean().optional(),
  logging: ElectronLoggingPolicySchema,
  performance: ElectronPerformancePolicySchema,
  crashReporting: ElectronCrashReportingPolicySchema,
  session: ElectronSessionPolicySchema,
}).optional();

// Electron IPC Policy Schema
export const ElectronIpcHandlerSchema = z.object({
  channel: z.string(),
  description: z.string().optional(),
});

export const ElectronIpcPolicySchema = z.object({
  whitelist: z.array(z.string()).optional(),
  handlers: z.array(ElectronIpcHandlerSchema).optional(),
}).optional();

// Electron Loading Policy Schema
export const ElectronLoadingPolicySchema = z.object({
  devUrl: z.string().optional(),
  prodIndex: z.string().optional(),
  splashHtml: z.string().optional(),
}).optional();

// Main Electron Policy Schema
// Accepts both flat format ({ window: {...}, security: {...}, ...}) 
// and namespaced format ({ electron: { window: {...}, ... } })
export const ElectronPolicySchema = z.object({
  window: ElectronWindowPolicySchema,
  security: ElectronSecurityPolicySchema,
  packaging: ElectronPackagingPolicySchema,
  autoUpdate: ElectronAutoUpdatePolicySchema,
  reliability: ElectronReliabilityPolicySchema,
  ipc: ElectronIpcPolicySchema,
  loading: ElectronLoadingPolicySchema,
}).passthrough();

// Namespaced format for DSL usage
export const ElectronPolicyNamespacedSchema = z.object({
  electron: ElectronPolicySchema,
}).passthrough();

// Union schema that accepts both formats
// Note: passthrough() cannot be called on union, so we apply it to individual schemas
export const ElectronPolicyInputSchema = z.union([
  ElectronPolicySchema,
  ElectronPolicyNamespacedSchema,
]);

export type ElectronPolicy = z.infer<typeof ElectronPolicySchema>;
export type ElectronPolicyNamespaced = z.infer<typeof ElectronPolicyNamespacedSchema>;
export type ElectronPolicyInput = z.infer<typeof ElectronPolicyInputSchema>;

