import { contextBridge, ipcRenderer } from "electron";

const whitelist = ["ping","open-file-dialog","run-shell"];

contextBridge.exposeInMainWorld("api", {
  invoke: (channel: string, ...args: unknown[]) => {
    if (!whitelist.includes(channel)) throw new Error("IPC channel not allowed");
    return ipcRenderer.invoke(channel, ...args);
  },
});
