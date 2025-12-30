import { IpcMain } from "electron";

export function registerCustomHandlers(ipcMain: IpcMain) {
  // Sample custom handler — implement your own in ipc-handlers.ts
  ipcMain.handle("run-shell", async (_event, ...args) => {
    // TODO: replace with real logic
    console.log("IPC 'run-shell' called with", args);
    return null;
  });

}
