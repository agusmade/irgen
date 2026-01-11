## Electron Checklist (status: up-to-date)

A quick summary of what is done and what is not for the Electron target. The checkboxes reflect current implementation.

### 1) Security baseline (required)

[x] `contextIsolation: true`, `nodeIntegration: false`, `sandbox` as needed  
[x] Minimal IPC via `contextBridge`, channel whitelist + payload schema  
[x] Navigation hardening: block `window.open`, block unexpected `will-navigate`, allowlist origins (startUrl/file)  
[x] CSP for renderer (injected via header in main + exposed via preload `api.csp`)  
[x] Disable eval/Function in renderer (patch in preload)  
➡️ Enforced via policy + guard in the emitter.

### 2) Dev vs Prod loading strategy (required)

[x] Dev: load `http://localhost:<port>` via `ELECTRON_START_URL`  
[x] Prod: load `file://.../index.html` (via `scripts/load-file.js`)  
[x] Centralized switching: policy `devUrl/prodIndex` + env `ELECTRON_START_URL`

### 3) Packaging & distribution (required)

[x] Default tool: `electron-builder` (policy `packaging.tool`)  
[x] Slots: `appId`, `productName`, icon, artifact naming, output/buildResources, asar  
[x] Code signing/notarization slots (`packaging.mac/win/linux`) provided

### 4) Auto-update (recommended for products)

[x] Policy: provider/url/channel/publish/headers/prerelease + retry tuning  
[x] `electron-updater` wiring (check/download/apply)  
[x] UI state: status event → renderer (`auto-update-status`), preload exposes `onUpdateStatus`  
[x] Fallback: auto retry (default 5 minutes, disable via policy `retryOnFail/retryDelayMs`)

### 5) OS integration (optional/advanced)

[ ] File open/save dialog + recent files  
[ ] File associations (double-click opens app)  
[ ] Deep link scheme (`myapp://...`)  
[ ] Tray / menubar  
[ ] Notifications  
[ ] Clipboard  
[ ] Print / PDF export  
→ Recommended as extension packs to keep the core clean.

### 6) Reliability & diagnostics

[x] Logging: main + renderer (electron-log)  
[x] Crash reporting slot: policy `reliability.crashReporting` (electron/sentry), electron crashReporter wired; Sentry needs SDK if used  
[x] Safe shutdown + session restore: window bounds persist/restore; IPC handlers cleaned up on quit  
[x] Single instance lock (policy `reliability.singleInstance`)  
[x] Performance guard: `backgroundThrottling` off by default (policy)

### 7) Testing / Golden outputs

[x] Snapshot file output for Electron (`main.ts`, `preload.ts`, `ipc-handlers.ts`, build config)  
[x] IPC whitelist golden

---

### Architecture notes

* All Electron decisions live in **ElectronPolicy** → **ElectronTargetIR**; the emitter only renders without hidden defaults.  
* Auto-update status is sent to the renderer; UI can subscribe via `window.api.onUpdateStatus(cb)`.  
* OS integration features should live as extensions (e.g., `@ext/electron-tray`, `@ext/electron-deeplink`).  
* If adding a new domain normalize or target, follow the `raw.schema`/`normalize.schema` pattern and `lowering/targets/to-*.ts`.
