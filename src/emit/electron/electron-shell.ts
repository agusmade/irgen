import fs from "node:fs";
import path from "node:path";
import type { ElectronTargetIR } from "../../ir/target/electron.js";
import { emitterEngine } from "../engine.js";
import { registerTargetEmitter } from "../registry.js";
import { uniq } from "../../utils/array.js";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function emitMain(outDir: string, ir: ElectronTargetIR) {
  const whitelist = ir.policies.electron.ipc?.whitelist ?? ir.policies.electron.security.ipcWhitelist ?? [];
  const devUrl = ir.policies.electron.loading?.devUrl ?? "http://localhost:3000";
  const prodIndex = ir.policies.electron.loading?.prodIndex ?? "../frontend/dist/index.html";
  const logging = ir.policies.electron.reliability?.logging ?? { enabled: true, level: "info", fileMaxSizeMB: 10, console: true };
  const performance = ir.policies.electron.reliability?.performance ?? { disableBackgroundThrottling: true };
  const crashReporting = ir.policies.electron.reliability?.crashReporting ?? { enabled: false };
  const autoUpdatePolicy = ir.policies.electron.autoUpdate ?? {};
  const autoUpdateRetry = { retryOnFail: autoUpdatePolicy.retryOnFail ?? true, retryDelayMs: autoUpdatePolicy.retryDelayMs ?? 300000 };
  const sessionPolicy = ir.policies.electron.reliability?.session ?? { restoreWindowBounds: true, windowStateFile: "window-state.json", saveOnClose: true };
  const mainTs = `
import { app, BrowserWindow, ipcMain, dialog, crashReporter } from "electron";
import path from "node:path";
import { registerCustomHandlers } from "./ipc-handlers.js";
import { pathToFileURL } from "node:url";
import log from "electron-log";
import fs from "node:fs";
import { autoUpdater } from "electron-updater";

const PROD_INDEX = path.join(__dirname, ${JSON.stringify(prodIndex)});
const PROD_URL = pathToFileURL(PROD_INDEX).href;

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

let mainWindow: BrowserWindow | null = null;
const STATE_FILE = path.join(app.getPath("userData"), ${JSON.stringify(sessionPolicy.windowStateFile ?? "window-state.json")});
const sendStatus = (status: string, payload?: unknown) => {
  try {
    mainWindow?.webContents.send("auto-update-status", { status, payload });
  } catch (e) {
    log.warn("Failed to send auto-update status", status, e);
  }
};

function loadWindowState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.width && parsed.height) {
      return parsed;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function saveWindowState(win: BrowserWindow) {
  if (!${sessionPolicy.saveOnClose ?? true}) return;
  try {
    const bounds = win.getBounds();
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(bounds), "utf-8");
  } catch (e) {
    log.warn("Failed to save window state", e);
  }
}

function createWindow() {
  const restored = ${sessionPolicy.restoreWindowBounds ?? true} ? loadWindowState() : null;
  const win = new BrowserWindow({
    width: restored?.width ?? ${ir.policies.electron.window.width},
    height: restored?.height ?? ${ir.policies.electron.window.height},
    resizable: ${ir.policies.electron.window.resizable},
    fullscreen: ${ir.policies.electron.window.fullscreen ?? false},
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: ${ir.policies.electron.security.contextIsolation},
      sandbox: ${ir.policies.electron.security.sandbox},
      nodeIntegration: false,
      backgroundThrottling: ${performance.disableBackgroundThrottling === false ? "true" : "false"},
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || ${JSON.stringify(devUrl)} || PROD_URL;
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e, url) => {
    const allow = url.startsWith(startUrl) || url.startsWith("file://");
    if (!allow) {
      e.preventDefault();
    }
  });

  // Dev vs prod: if ELECTRON_START_URL not set, prefer file:// dist
  const resolvedStartUrl = process.env.ELECTRON_START_URL ? startUrl : PROD_URL;
  win.loadURL(resolvedStartUrl);

  const csp = ${JSON.stringify(ir.policies.electron.security.csp ?? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'")};
  const { session } = win.webContents;
  session.webRequest.onHeadersReceived((details, callback) => {
    const headers = {
      ...details.responseHeaders,
      "Content-Security-Policy": [csp],
    };
    callback({ responseHeaders: headers });
  });

  win.webContents.openDevTools({ mode: ${ir.policies.electron.window.devTools ? '"detach"' : '"undocked"'} });
  win.on("closed", () => { mainWindow = null; });
  win.on("close", () => saveWindowState(win));
  mainWindow = win;
}

const SINGLE_INSTANCE = ${ir.policies.electron.reliability?.singleInstance ?? true};

if (${logging.enabled ?? true}) {
  log.transports.file.level = ${JSON.stringify(logging.level ?? "info")};
  log.transports.file.maxSize = ${(logging.fileMaxSizeMB ?? 10) * 1024 * 1024};
  log.transports.console.level = ${logging.console ? JSON.stringify(logging.level ?? "info") : JSON.stringify("error")};
  log.info("Logger initialized");
}

if (${crashReporting.enabled ?? false}) {
  const provider: string = ${JSON.stringify(crashReporting.provider ?? "electron")};
  if (provider === "electron") {
    crashReporter.start({
      productName: ${JSON.stringify(crashReporting.productName ?? ir.policies.electron.packaging.productName ?? "electron-app")},
      companyName: ${JSON.stringify(crashReporting.companyName ?? "ExampleCo")},
      submitURL: ${JSON.stringify(crashReporting.submitURL ?? "")},
      uploadToServer: Boolean(${crashReporting.submitURL ? "true" : "false"}),
      compress: true,
      extra: { environment: ${JSON.stringify(crashReporting.environment ?? "development")} },
    });
    log.info("Crash reporter (electron) initialized");
  } else if (provider === "sentry") {
    log.warn("Crash reporter (sentry) requested but SDK not wired; add @sentry/electron and init here.");
  }
}

const AUTO_UPDATE_ENABLED = ${ir.policies.electron.autoUpdate?.enabled ?? false};
if (AUTO_UPDATE_ENABLED) {
  const feedURL = ${JSON.stringify(ir.policies.electron.autoUpdate?.url ?? "")};
  autoUpdater.autoDownload = true;
  autoUpdater.allowPrerelease = Boolean(${ir.policies.electron.autoUpdate?.allowPrerelease ?? false});
  if (feedURL) {
    autoUpdater.setFeedURL({
      provider: ${JSON.stringify(ir.policies.electron.autoUpdate?.provider ?? "generic")},
      url: feedURL,
      channel: ${JSON.stringify(ir.policies.electron.autoUpdate?.channel ?? "latest")},
      requestHeaders: ${JSON.stringify(ir.policies.electron.autoUpdate?.requestHeaders ?? {})},
    });
  }
  log.info("Auto-updater configured", { feedURL });

  autoUpdater.on("error", (err) => {
    log.error("Auto-update error", err);
    sendStatus("error", err?.message ?? String(err));
    if (${autoUpdateRetry.retryOnFail}) {
      const delay = ${autoUpdateRetry.retryDelayMs ?? 300000};
      log.warn(\`Retrying update check in \${delay} ms\`);
      setTimeout(() => {
        sendStatus("retrying", { delay });
        autoUpdater.checkForUpdatesAndNotify().catch(e => {
          log.error("Auto-update retry failed", e);
        });
      }, delay);
    }
  });
  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for updates...");
    sendStatus("checking");
  });
  autoUpdater.on("update-available", info => {
    log.info("Update available", info);
    sendStatus("available", info);
  });
  autoUpdater.on("update-not-available", info => {
    log.info("No update", info);
    sendStatus("not-available", info);
  });
  autoUpdater.on("download-progress", progress => {
    log.info("Update download progress", progress);
    sendStatus("downloading", progress);
  });
  autoUpdater.on("update-downloaded", info => {
    log.info("Update downloaded; will quit and install");
    sendStatus("downloaded", info);
    autoUpdater.quitAndInstall();
  });

  app.whenReady().then(() => autoUpdater.checkForUpdatesAndNotify());
}

if (SINGLE_INSTANCE) {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    process.exit(0);
  }

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  registerCustomHandlers(ipcMain);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  // Guard IPC handlers
  ipcMain.removeHandler("ping");
  ipcMain.removeHandler("open-file-dialog");
  // custom handlers are registered in registerCustomHandlers; simplest is to rely on electron cleanup
});

ipcMain.handle("ping", () => "pong");

ipcMain.handle("open-file-dialog", async () => {
  const res = await dialog.showOpenDialog({ properties: ["openFile"] });
  if (res.canceled) return null;
  return res.filePaths[0];
});

// generated whitelist for preload: ${whitelist.join(", ")}
  `.trim();

  fs.writeFileSync(path.join(outDir, "main.ts"), mainTs, "utf-8");
}

function emitPreload(outDir: string, ir: ElectronTargetIR) {
  const whitelist = uniq([
    ...(ir.policies.electron.security.ipcWhitelist ?? []),
    ...(ir.policies.electron.ipc?.whitelist ?? []),
  ]);
  const preload = `
import { contextBridge, ipcRenderer } from "electron";
import log from "electron-log/renderer";

const whitelist = ${JSON.stringify(whitelist)};

// Simple CSP helper: renderer should set a CSP meta tag or header; we reflect policy here for clarity.
const CONTENT_SECURITY_POLICY = ${JSON.stringify("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'")};

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
  `.trim();

  fs.writeFileSync(path.join(outDir, "preload.ts"), preload, "utf-8");
}

function emitPackageJson(outDir: string, ir: ElectronTargetIR) {
  const pkg = {
    name: ir.policies.electron.packaging.productName?.toLowerCase() || "electron-app",
    version: "0.1.0",
    private: true,
    main: "dist/main.js",
    scripts: {
      start: "electron .",
      build: "tsc -p tsconfig.json",
      "start:frontend": "cd ../frontend && npm install && npm run dev",
      "start:electron:dev": "cross-env ELECTRON_START_URL=http://localhost:5173 electron .",
      "start:electron:file": "npm run build && electron ./scripts/load-file.js",
      "package:electron": "npm run build && electron-builder -c electron-builder.config.json",
    },
    devDependencies: {
      electron: "^29.0.0",
      typescript: "^5.6.3",
      "cross-env": "^7.0.3",
      "@types/node": "^22.10.2",
      "electron-builder": "^25.1.8",
    },
    dependencies: {
      "electron-log": "^5.1.2",
      "electron-updater": "^6.3.7",
    },
  };

  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");
}

function emitElectronBuilderConfig(outDir: string, ir: ElectronTargetIR) {
  const packaging = ir.policies.electron.packaging ?? {};
  const autoUpdate = ir.policies.electron.autoUpdate ?? {};
  if (packaging.tool && packaging.tool !== "electron-builder") return;

  const config: Record<string, any> = {
    appId: packaging.appId,
    productName: packaging.productName,
    artifactName: packaging.artifactName ?? "${productName}-${version}-${os}-${arch}",
    directories: {
      output: packaging.outputDir ?? "release",
      buildResources: packaging.buildResources ?? "build",
    },
    files: ["dist/**", "frontend/dist/**", "package.json"],
    asar: packaging.asar ?? true,
  };

  if (packaging.icon) config.icon = packaging.icon;
  if (packaging.extraFiles) config.extraFiles = packaging.extraFiles;
  if (packaging.extraResources) config.extraResources = packaging.extraResources;
  if (packaging.mac) config.mac = packaging.mac;
  if (packaging.win) config.win = packaging.win;
  if (packaging.linux) config.linux = packaging.linux;
  if (autoUpdate.enabled) {
    // electron-builder expects publish config; allow direct override or simple provider/url/channel
    if (autoUpdate.publish) {
      config.publish = autoUpdate.publish;
    } else if (autoUpdate.provider && autoUpdate.url) {
      config.publish = [{ provider: autoUpdate.provider, url: autoUpdate.url, channel: autoUpdate.channel ?? "latest" }];
    }
  }

  fs.writeFileSync(path.join(outDir, "electron-builder.config.json"), JSON.stringify(config, null, 2), "utf-8");
}

function emitTsConfig(outDir: string) {
  const tsconfig = {
    compilerOptions: {
      module: "commonjs",
      target: "es2022",
      outDir: "dist",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      moduleResolution: "node",
      types: ["node", "electron"],
    },
    include: ["*.ts"],
  };
  fs.writeFileSync(path.join(outDir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2), "utf-8");
}

function emitLoadFileScript(outDir: string) {
  const script = `
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { registerCustomHandlers } = require("../dist/ipc-handlers.js");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../dist/preload.js"),
      contextIsolation: true,
    },
  });

  const index = path.join(__dirname, "../../frontend/dist/index.html");
  if (!fs.existsSync(index)) {
    console.error("frontend/dist/index.html not found. Build frontend first (npm run build in ../frontend).");
    return;
  }
  win.loadFile(index);
}

ipcMain.handle("open-file-dialog", async () => {
  const res = await dialog.showOpenDialog({ properties: ["openFile"] });
  if (res.canceled) return null;
  return res.filePaths[0];
});

registerCustomHandlers(ipcMain);

if (app && app.whenReady) {
  app.whenReady().then(createWindow);
} else {
  console.error("Electron app context not available; ensure this script is run via electron .");
}
  `.trim();

  const scriptsDir = path.join(outDir, "scripts");
  ensureDir(scriptsDir);
  fs.writeFileSync(path.join(scriptsDir, "load-file.js"), script, "utf-8");
}

export function emitElectronShell(ir: ElectronTargetIR, outDir: string) {
  ensureDir(outDir);
  emitMain(outDir, ir);
  emitPreload(outDir, ir);
  emitIpcHandlers(outDir, ir);
  emitPackageJson(outDir, ir);
  emitElectronBuilderConfig(outDir, ir);
  emitTsConfig(outDir);
  emitLoadFileScript(outDir);
}

try {
  emitterEngine.registerEmitter("electron-shell", async (ir: ElectronTargetIR, outDir: string) => {
    emitElectronShell(ir, outDir);
  }, { force: true });
} catch (e) {
  // ignore double registration
}

try {
  registerTargetEmitter("electron", "electron-shell", { force: true });
} catch (e) {
  // ignore
}
function emitIpcHandlers(outDir: string, ir: ElectronTargetIR) {
  const handlers = ir.policies.electron.ipc?.handlers ?? [];
  const defaultHandled = new Set(["ping", "open-file-dialog"]);
  const filtered = handlers.filter(h => !defaultHandled.has(h.channel));

  const body = filtered.length
    ? filtered.map(h => `
  // ${h.description ?? "TODO implement handler"}
  ipcMain.handle("${h.channel}", async (_event, ...args) => {
    // TODO: replace with real logic
    console.log("IPC '${h.channel}' called with", args);
    return null;
  });
`).join("\n")
    : `
  // Add custom IPC handlers here. Example:
  // ipcMain.handle("my-channel", async (_event, ...args) => { return "ok"; });
`;

  const content = `
import { IpcMain } from "electron";

export function registerCustomHandlers(ipcMain: IpcMain) {${body}
}
`.trim();

  fs.writeFileSync(path.join(outDir, "ipc-handlers.ts"), content, "utf-8");
}
