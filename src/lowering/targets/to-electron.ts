import type { FrontendIR } from "../../ir/domain/frontend.js";
import type { ElectronTargetIR, ElectronPolicies } from "../../ir/target/electron.js";
import { ElectronPolicyInputSchema } from "../../ir/target/electron.policy.js";
import { engine } from "../engine.js";

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

/**
 * Target lowering: FrontendIR → ElectronTargetIR
 * 
 * Note: Electron target uses FrontendIR as its domain IR input (electron shares
 * the frontend mapper), so the function name follows the pattern:
 * {domain}DomainTo{Target}Target -> frontendDomainToElectronTarget
 */
export function frontendDomainToElectronTarget(ir: FrontendIR, policies?: ElectronPolicyInput): ElectronTargetIR {
  return {
    ...ir,
    policies: resolvePolicies(ir, policies),
  };
}

try {
  engine.registerTransform("electron-target", (ir: FrontendIR, policies?: any) => frontendDomainToElectronTarget(ir, policies));
  engine.registerPolicySchema("electron-target", ElectronPolicyInputSchema);
} catch (e) {
  // ignore double registration
}
