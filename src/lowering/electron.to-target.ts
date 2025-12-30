import type { FrontendIR } from "../ir/domain/frontend.js";
import type { ElectronTargetIR, ElectronPolicies } from "../ir/target/electron.js";
import { engine } from "./engine.js";
import { z } from "zod";

export type ElectronPolicyInput = {
  electron?: {
    window?: Partial<ElectronPolicies["electron"]["window"]>;
    security?: Partial<ElectronPolicies["electron"]["security"]>;
    packaging?: Partial<ElectronPolicies["electron"]["packaging"]>;
    ipc?: Partial<ElectronPolicies["electron"]["ipc"]>;
  };
} | {
  window?: Partial<ElectronPolicies["electron"]["window"]>;
  security?: Partial<ElectronPolicies["electron"]["security"]>;
  packaging?: Partial<ElectronPolicies["electron"]["packaging"]>;
  ipc?: Partial<ElectronPolicies["electron"]["ipc"]>;
};

const DEFAULT_WINDOW = { width: 1280, height: 800, resizable: true, devTools: false };
const DEFAULT_SECURITY = { contextIsolation: true, sandbox: false, ipcWhitelist: ["ping", "open-file-dialog"] as string[] };
const DEFAULT_PACKAGING = (appName: string): ElectronPolicies["electron"]["packaging"] => ({
  appId: `com.example.${appName.toLowerCase()}`,
  productName: appName,
});

function resolvePolicies(ir: FrontendIR, policies?: ElectronPolicyInput): ElectronPolicies {
  const raw = (policies as any)?.electron ?? policies ?? {};
  const window = { ...DEFAULT_WINDOW, ...(raw.window ?? {}) };
  const security = { ...DEFAULT_SECURITY, ...(raw.security ?? {}) };
  const packaging = { ...DEFAULT_PACKAGING(ir.appName), ...(raw.packaging ?? {}) };
  const ipcWhitelist = Array.from(new Set([
    ...(security.ipcWhitelist ?? []),
    ...((raw.ipc?.whitelist ?? []) as string[]),
  ]));
  const ipc = {
    whitelist: ipcWhitelist,
    handlers: raw.ipc?.handlers ?? [],
  };
  return { electron: { window, security: { ...security, ipcWhitelist }, packaging, ipc } };
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
    }).optional(),
    packaging: z.object({
      appId: z.string().optional(),
      productName: z.string().optional(),
      artifactName: z.string().optional(),
    }).optional(),
    ipc: z.object({
      whitelist: z.array(z.string()).optional(),
      handlers: z.array(z.object({
        channel: z.string(),
        description: z.string().optional(),
      })).optional(),
    }).optional(),
  }).passthrough();

  engine.registerTransform("electron-target", (ir: FrontendIR, policies?: any) => frontendToElectronTarget(ir, policies));
  engine.registerPolicySchema("electron-target", schema);
} catch (e) {
  // ignore double registration
}
