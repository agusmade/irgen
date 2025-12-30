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
  const mainTs = `
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import { registerCustomHandlers } from "./ipc-handlers.js";

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

function createWindow() {
  const win = new BrowserWindow({
    width: ${ir.policies.electron.window.width},
    height: ${ir.policies.electron.window.height},
    resizable: ${ir.policies.electron.window.resizable},
    fullscreen: ${ir.policies.electron.window.fullscreen ?? false},
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: ${ir.policies.electron.security.contextIsolation},
      sandbox: ${ir.policies.electron.security.sandbox},
    },
  });

  win.loadURL(process.env.ELECTRON_START_URL || "http://localhost:3000");
  win.webContents.openDevTools({ mode: ${ir.policies.electron.window.devTools ? '"detach"' : '"undocked"'} });
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

const whitelist = ${JSON.stringify(whitelist)};

contextBridge.exposeInMainWorld("api", {
  invoke: (channel: string, ...args: unknown[]) => {
    if (!whitelist.includes(channel)) throw new Error("IPC channel not allowed");
    return ipcRenderer.invoke(channel, ...args);
  },
});
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
    },
    devDependencies: {
      electron: "^29.0.0",
      typescript: "^5.6.3",
      "cross-env": "^7.0.3",
      "@types/node": "^22.10.2",
    },
  };

  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");
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
