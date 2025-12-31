import { contextBridge, ipcRenderer } from "electron";
import log from "electron-log/renderer";

const whitelist = ["ping","open-file-dialog","run-shell"];

// Simple CSP helper: renderer should set a CSP meta tag or header; we reflect policy here for clarity.
const CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'";

contextBridge.exposeInMainWorld("api", {
  invoke: (channel: string, ...args: unknown[]) => {
    if (!whitelist.includes(channel)) throw new Error("IPC channel not allowed");
    return ipcRenderer.invoke(channel, ...args);
  },
  csp: CONTENT_SECURITY_POLICY,
  log: (level: keyof typeof log | "info" | "warn" | "error", ...args: unknown[]) => {
    const fn = (log as any)[level] ?? log.info;
    fn(...args);
  },
  onUpdateStatus: (cb: (payload: { status: string; payload?: unknown }) => void) => {
    const handler = (_event: unknown, data: any) => cb(data);
    ipcRenderer.on("auto-update-status", handler);
    return () => ipcRenderer.removeListener("auto-update-status", handler);
  },
});

// Patch global eval/Function to reduce accidental use
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).eval = undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).Function = undefined;
