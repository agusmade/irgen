import { frontend } from "../src/dsl/frontend-runtime.js";

// Same DSL drives both web/PWA and Electron targets.
frontend("Electron Docs", {
  pwa: { enabled: true, name: "Electron Docs", shortName: "EDocs", startUrl: "/", scope: "/" },
  policies: {
    electron: {
      window: { width: 1280, height: 800, devTools: true },
      security: { ipcWhitelist: ["ping", "open-file-dialog"] },
      packaging: { productName: "ElectronDocs" },
      ipc: {
        whitelist: ["open-file-dialog", "run-shell"],
        handlers: [
          { channel: "open-file-dialog", description: "Default example: pick a file and return its path" },
          { channel: "run-shell", description: "Sample custom handler — implement your own in ipc-handlers.ts" },
        ],
      },
    },
  },
}, (app) => {
  app.page("Home", { path: "/" }, (p) => {
    p.component("Intro");
    p.component("Highlights");
  });

  app.page("Guide", { path: "/guide" }, (p) => {
    p.component("Quickstart");
    p.component("Policies");
    p.component("IpcDemo");
  });

  app.page("Feedback", { path: "/feedback" }, (p) => {
    p.component("FeedbackForm");
  });

  app.component("Intro", (c) => {
    c.prop("title", "irgen Electron Example");
    c.prop("summary", "One DSL → Web/PWA + Electron shell. FrontendIR stays identical; Electron adds main/preload only.");
  });

  app.component("Highlights", (c) => {
    c.prop("web", "React + router + Tailwind; optional PWA assets.");
    c.prop("electron", "Generates main.ts, preload.ts, package/tsconfig for Electron shell without changing DSL.");
  });

  app.component("Quickstart", (c) => {
    c.prop("gen", "npx irgen examples/electron-docs.dsl.ts --targets=frontend,electron --outDir=generated/electron-docs");
    c.prop("runWeb", "cd generated/electron-docs/frontend && npm install && npm run dev");
    c.prop("runElectron", "cd generated/electron-docs/electron && npm install && npm run start");
  });

  app.component("Policies", (c) => {
    c.prop("window", "width/height/resizable/devTools/fullscreen");
    c.prop("security", "contextIsolation/sandbox/ipcWhitelist");
    c.prop("packaging", "appId/productName/artifactName");
  });

  app.component("IpcDemo", (c) => {
    c.prop("title", "IPC: Open File Dialog");
    c.prop("ipcChannel", "open-file-dialog");
    c.prop("description", "Click the button to request the main process to open a file dialog. Requires electron security whitelist. Additional custom IPC handlers live in ipc-handlers.ts.");
  });

  app.component("FeedbackForm", (c) => {
    c.field("name", "text", "Name", { required: true }, { icon: "User" });
    c.field("email", "email", "Email", { required: true }, { icon: "Mail" });
    c.field("message", "textarea", "Message", { required: true, minLength: 5 }, { icon: "MessageSquare" });
  });
});
