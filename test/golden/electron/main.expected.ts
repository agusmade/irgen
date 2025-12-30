import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import { registerCustomHandlers } from "./ipc-handlers.js";

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    resizable: true,
    fullscreen: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
    },
  });

  win.loadURL(process.env.ELECTRON_START_URL || "http://localhost:3000");
  win.webContents.openDevTools({ mode: "detach" });
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

// generated whitelist for preload: ping, open-file-dialog, run-shell
