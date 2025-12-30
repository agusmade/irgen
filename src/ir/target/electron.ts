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
}

export interface ElectronPackagingPolicy {
  appId?: string;
  productName?: string;
  artifactName?: string;
}

export interface ElectronIpcHandler {
  channel: string;
  description?: string;
}

export interface ElectronIpcPolicy {
  whitelist?: string[];
  handlers?: ElectronIpcHandler[];
}

export interface ElectronPolicies {
  electron: {
    window: ElectronWindowPolicy;
    security: ElectronSecurityPolicy;
    packaging: ElectronPackagingPolicy;
    ipc?: ElectronIpcPolicy;
  };
}

export interface ElectronTargetIR extends FrontendIR {
  policies: ElectronPolicies;
}
