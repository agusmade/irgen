import { app, BrowserWindow, ipcMain, dialog, crashReporter } from "electron";
import path from "node:path";
import { registerCustomHandlers } from "./ipc-handlers.js";
import { pathToFileURL } from "node:url";
import log from "electron-log";
import fs from "node:fs";
import { autoUpdater } from "electron-updater";

const PROD_INDEX = path.join(__dirname, "../frontend/dist/index.html");
const PROD_URL = pathToFileURL(PROD_INDEX).href;

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

let mainWindow: BrowserWindow | null = null;
const STATE_FILE = path.join(app.getPath("userData"), "window-state.json");
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
  if (!true) return;
  try {
    const bounds = win.getBounds();
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(bounds), "utf-8");
  } catch (e) {
    log.warn("Failed to save window state", e);
  }
}

function createWindow() {
  const restored = true ? loadWindowState() : null;
  const win = new BrowserWindow({
    width: restored?.width ?? 1280,
    height: restored?.height ?? 800,
    resizable: true,
    fullscreen: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || "http://localhost:3000" || PROD_URL;
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

  const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'";
  const { session } = win.webContents;
  session.webRequest.onHeadersReceived((details, callback) => {
    const headers = {
      ...details.responseHeaders,
      "Content-Security-Policy": [csp],
    };
    callback({ responseHeaders: headers });
  });

  win.webContents.openDevTools({ mode: "detach" });
  win.on("closed", () => { mainWindow = null; });
  win.on("close", () => saveWindowState(win));
  mainWindow = win;
}

const SINGLE_INSTANCE = true;

if (true) {
  log.transports.file.level = "info";
  log.transports.file.maxSize = 10485760;
  log.transports.console.level = "info";
  log.info("Logger initialized");
}

if (false) {
  const provider: string = "electron";
  if (provider === "electron") {
    crashReporter.start({
      productName: "ElectronDocs",
      companyName: "ExampleCo",
      submitURL: "",
      uploadToServer: Boolean(false),
      compress: true,
      extra: { environment: "development" },
    });
    log.info("Crash reporter (electron) initialized");
  } else if (provider === "sentry") {
    log.warn("Crash reporter (sentry) requested but SDK not wired; add @sentry/electron and init here.");
  }
}

const AUTO_UPDATE_ENABLED = false;
if (AUTO_UPDATE_ENABLED) {
  const feedURL = "";
  autoUpdater.autoDownload = true;
  autoUpdater.allowPrerelease = Boolean(false);
  if (feedURL) {
    autoUpdater.setFeedURL({
      provider: "generic",
      url: feedURL,
      channel: "latest",
      requestHeaders: {},
    });
  }
  log.info("Auto-updater configured", { feedURL });

  autoUpdater.on("error", (err) => {
    log.error("Auto-update error", err);
    sendStatus("error", err?.message ?? String(err));
    if (true) {
      const delay = 300000;
      log.warn(`Retrying update check in ${delay} ms`);
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

// generated whitelist for preload: ping, open-file-dialog, run-shell
