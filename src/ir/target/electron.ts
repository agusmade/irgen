import type { FrontendIR } from "../domain/frontend.js";

export interface ElectronWindowPolicy {
  width: number;
  height: number;
  resizable?: boolean;
  fullscreen?: boolean;
  devTools?: boolean;
}

export interface ElectronSecurityPolicy {
  contextIsolation?: boolean;
  sandbox?: boolean;
  ipcWhitelist?: string[];
  csp?: string;
}

export interface ElectronPackagingPolicy {
  tool?: "electron-builder";
  appId?: string;
  productName?: string;
  artifactName?: string;
  outputDir?: string;
  buildResources?: string;
  icon?: string;
  asar?: boolean;
  extraFiles?: string[];
  extraResources?: Array<string | { from: string; to?: string }>;
  mac?: Record<string, unknown>;
  win?: Record<string, unknown>;
  linux?: Record<string, unknown>;
}

export interface ElectronAutoUpdatePolicy {
  enabled?: boolean;
  provider?: "generic" | "github" | "spaces" | "s3";
  url?: string;
  channel?: string;
  publish?: Record<string, unknown>;
  allowPrerelease?: boolean;
  requestHeaders?: Record<string, string>;
  retryOnFail?: boolean;
  retryDelayMs?: number;
}

export interface ElectronIpcHandler {
  channel: string;
  description?: string;
}

export interface ElectronIpcPolicy {
  whitelist?: string[];
  handlers?: ElectronIpcHandler[];
}

export interface ElectronLoadingPolicy {
  devUrl?: string;
  prodIndex?: string;
  splashHtml?: string;
}

export interface ElectronPolicies {
  electron: {
    window: ElectronWindowPolicy;
    security: ElectronSecurityPolicy;
    packaging: ElectronPackagingPolicy;
    autoUpdate?: ElectronAutoUpdatePolicy;
    ipc?: ElectronIpcPolicy;
    loading?: ElectronLoadingPolicy;
    reliability?: ElectronReliabilityPolicy;
  };
}

export interface ElectronReliabilityPolicy {
  singleInstance?: boolean;
  logging?: {
    enabled?: boolean;
    level?: "error" | "warn" | "info" | "verbose" | "debug" | "silly";
    fileMaxSizeMB?: number;
    console?: boolean;
  };
  performance?: {
    disableBackgroundThrottling?: boolean;
  };
  crashReporting?: ElectronCrashReportingPolicy;
  session?: ElectronSessionPolicy;
}

export interface ElectronCrashReportingPolicy {
  enabled?: boolean;
  provider?: "electron" | "sentry";
  submitURL?: string; // for electron crashReporter or self-hosted collector
  dsn?: string; // for sentry (placeholder stub)
  productName?: string;
  companyName?: string;
  environment?: string;
}

export interface ElectronSessionPolicy {
  restoreWindowBounds?: boolean;
  windowStateFile?: string;
  saveOnClose?: boolean;
}

export interface ElectronTargetIR extends FrontendIR {
  policies: ElectronPolicies;
}
