import type { FrontendIR } from "../../ir/domain/frontend.js";
import type { ElectronTargetIR, ElectronPolicies } from "../../ir/target/electron.js";
import { engine } from "../engine.js";
import { z } from "zod";

export type ElectronPolicyInput = {
  electron?: {
    window?: Partial<ElectronPolicies["electron"]["window"]>;
    security?: Partial<ElectronPolicies["electron"]["security"]>;
    packaging?: Partial<ElectronPolicies["electron"]["packaging"]>;
    autoUpdate?: Partial<ElectronPolicies["electron"]["autoUpdate"]>;
    ipc?: Partial<ElectronPolicies["electron"]["ipc"]>;
    loading?: Partial<ElectronPolicies["electron"]["loading"]>;
    reliability?: Partial<ElectronPolicies["electron"]["reliability"]>;
  };
} | {
  window?: Partial<ElectronPolicies["electron"]["window"]>;
  security?: Partial<ElectronPolicies["electron"]["security"]>;
  packaging?: Partial<ElectronPolicies["electron"]["packaging"]>;
  autoUpdate?: Partial<ElectronPolicies["electron"]["autoUpdate"]>;
  ipc?: Partial<ElectronPolicies["electron"]["ipc"]>;
  loading?: Partial<ElectronPolicies["electron"]["loading"]>;
  reliability?: Partial<ElectronPolicies["electron"]["reliability"]>;
};

const DEFAULT_WINDOW = { width: 1280, height: 800, resizable: true, devTools: false };
const DEFAULT_SECURITY = {
  contextIsolation: true,
  sandbox: false,
  ipcWhitelist: ["ping", "open-file-dialog"] as string[],
  csp: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'",
};
const DEFAULT_PACKAGING = (appName: string): ElectronPolicies["electron"]["packaging"] => ({
  tool: "electron-builder",
  appId: `com.example.${appName.toLowerCase()}`,
  productName: appName,
  artifactName: "${productName}-${version}-${os}-${arch}",
  outputDir: "release",
  buildResources: "build",
  asar: true,
});
const DEFAULT_LOADING = {
  devUrl: "http://localhost:3000",
  prodIndex: "../frontend/dist/index.html",
};
const DEFAULT_AUTO_UPDATE = {
  enabled: false,
  retryOnFail: true,
  retryDelayMs: 300000,
};
const DEFAULT_RELIABILITY = {
  singleInstance: true,
  logging: {
    enabled: true,
    level: "info",
    fileMaxSizeMB: 10,
    console: true,
  },
  performance: {
    disableBackgroundThrottling: true,
  },
  crashReporting: {
    enabled: false,
    provider: "electron",
  },
  session: {
    restoreWindowBounds: true,
    windowStateFile: "window-state.json",
    saveOnClose: true,
  },
};

function resolvePolicies(ir: FrontendIR, policies?: ElectronPolicyInput): ElectronPolicies {
  const raw = (policies as any)?.electron ?? policies ?? {};
  const window = { ...DEFAULT_WINDOW, ...(raw.window ?? {}) };
  const security = { ...DEFAULT_SECURITY, ...(raw.security ?? {}) };
  const packaging = { ...DEFAULT_PACKAGING(ir.appName), ...(raw.packaging ?? {}) };
  const autoUpdate = { ...DEFAULT_AUTO_UPDATE, ...(raw.autoUpdate ?? {}) };
  const reliability = { ...DEFAULT_RELIABILITY, ...(raw.reliability ?? {}) };
  const ipcWhitelist = Array.from(new Set([
    ...(security.ipcWhitelist ?? []),
    ...((raw.ipc?.whitelist ?? []) as string[]),
  ]));
  const ipc = {
    whitelist: ipcWhitelist,
    handlers: raw.ipc?.handlers ?? [],
  };
  const loading = { ...DEFAULT_LOADING, ...(raw.loading ?? {}) };
  return { electron: { window, security: { ...security, ipcWhitelist }, packaging, autoUpdate, ipc, loading, reliability } };
}

export function frontendToElectronTarget(ir: FrontendIR, policies?: ElectronPolicyInput): ElectronTargetIR {
  return {
    ...ir,
    policies: resolvePolicies(ir, policies),
  };
}

try {
  const schema = z.object({
    window: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
      resizable: z.boolean().optional(),
      fullscreen: z.boolean().optional(),
      devTools: z.boolean().optional(),
    }).optional(),
    security: z.object({
      contextIsolation: z.boolean().optional(),
      sandbox: z.boolean().optional(),
      ipcWhitelist: z.array(z.string()).optional(),
      csp: z.string().optional(),
    }).optional(),
    packaging: z.object({
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
    }).optional(),
    autoUpdate: z.object({
      enabled: z.boolean().optional(),
      provider: z.enum(["generic", "github", "spaces", "s3"]).optional(),
      url: z.string().optional(),
      channel: z.string().optional(),
      publish: z.record(z.any()).optional(),
      allowPrerelease: z.boolean().optional(),
      requestHeaders: z.record(z.string()).optional(),
      retryOnFail: z.boolean().optional(),
      retryDelayMs: z.number().optional(),
    }).optional(),
    reliability: z.object({
      singleInstance: z.boolean().optional(),
      logging: z.object({
        enabled: z.boolean().optional(),
        level: z.enum(["error", "warn", "info", "verbose", "debug", "silly"]).optional(),
        fileMaxSizeMB: z.number().optional(),
        console: z.boolean().optional(),
      }).optional(),
      performance: z.object({
        disableBackgroundThrottling: z.boolean().optional(),
      }).optional(),
      crashReporting: z.object({
        enabled: z.boolean().optional(),
        provider: z.enum(["electron", "sentry"]).optional(),
        submitURL: z.string().optional(),
        dsn: z.string().optional(),
        productName: z.string().optional(),
        companyName: z.string().optional(),
        environment: z.string().optional(),
      }).optional(),
      session: z.object({
        restoreWindowBounds: z.boolean().optional(),
        windowStateFile: z.string().optional(),
        saveOnClose: z.boolean().optional(),
      }).optional(),
    }).optional(),
    ipc: z.object({
      whitelist: z.array(z.string()).optional(),
      handlers: z.array(z.object({
        channel: z.string(),
        description: z.string().optional(),
      })).optional(),
    }).optional(),
    loading: z.object({
      devUrl: z.string().optional(),
      prodIndex: z.string().optional(),
    }).optional(),
  }).passthrough();

  engine.registerTransform("electron-target", (ir: FrontendIR, policies?: any) => frontendToElectronTarget(ir, policies));
  engine.registerPolicySchema("electron-target", schema);
} catch (e) {
  // ignore double registration
}
