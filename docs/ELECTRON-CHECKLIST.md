## Electron Checklist (status: up-to-date)

Ringkasan cepat apa saja yang sudah dan belum untuk target Electron. Checkbox mencerminkan implementasi saat ini.

### 1) Security baseline (wajib)

[x] `contextIsolation: true`, `nodeIntegration: false`, `sandbox` sesuai kebutuhan  
[x] IPC minimal via `contextBridge`, whitelist channel + schema payload  
[x] Hardening navigasi: block `window.open`, block unexpected `will-navigate`, allowlist origins (startUrl/file)  
[x] CSP untuk renderer (disuntik via header di main + diekspos via preload `api.csp`)  
[x] Disable eval/Function di renderer (patch di preload)  
➡️ Dikunci sebagai policy + guard di emitter.

### 2) Dev vs Prod loading strategy (wajib)

[x] Dev: load `http://localhost:<port>` via `ELECTRON_START_URL`  
[x] Prod: load `file://.../index.html` (via `scripts/load-file.js`)  
[x] Switching tersentral: policy loading `devUrl/prodIndex` + env `ELECTRON_START_URL`

### 3) Packaging & distribution (wajib)

[x] Tool default: `electron-builder` (policy `packaging.tool`)  
[x] Slots: `appId`, `productName`, icon, artifact naming, output/buildResources, asar  
[x] Code signing/notarization slots (`packaging.mac/win/linux`) disediakan

### 4) Auto-update (disarankan untuk produk)

[x] Policy: provider/url/channel/publish/headers/prerelease + retry tuning  
[x] `electron-updater` wiring (check/download/apply)  
[x] UI state: status event → renderer (`auto-update-status`), preload expose `onUpdateStatus`  
[x] Fallback: retry otomatis (default 5 menit, matikan via policy `retryOnFail/retryDelayMs`)

### 5) OS integration (opsional/lanjutan)

[ ] File open/save dialog + recent files  
[ ] File associations (double-click buka app)  
[ ] Deep link scheme (`myapp://...`)  
[ ] Tray / menubar  
[ ] Notifications  
[ ] Clipboard  
[ ] Print / PDF export  
→ Direkomendasikan sebagai extension pack agar core tetap bersih.

### 6) Reliability & diagnostics

[x] Logging: main + renderer (electron-log)  
[x] Crash reporting slot: policy `reliability.crashReporting` (electron/sentry), electron crashReporter di-wire; sentry perlu SDK jika dipakai  
[x] Safe shutdown + session restore: window bounds persist/restore; IPC handlers dibersihkan saat quit  
[x] Single instance lock (policy `reliability.singleInstance`)  
[x] Performance guard: `backgroundThrottling` off by default (policy)

### 7) Testing / Golden outputs

[x] Snapshot file output electron (`main.ts`, `preload.ts`, `ipc-handlers.ts`, config build)  
[x] IPC whitelist golden

---

### Catatan arsitektur

* Semua keputusan Electron berada di **ElectronPolicy** → **ElectronTargetIR**; emitter hanya merender tanpa default tersembunyi.  
* Auto-update status dikirim ke renderer; UI bisa berlangganan via `window.api.onUpdateStatus(cb)`.  
* Fitur OS integration spesifik sebaiknya hidup sebagai extension (mis. `@ext/electron-tray`, `@ext/electron-deeplink`).  
* Jika menambah domain normalize atau target baru, ikuti pola `raw.schema`/`normalize.schema` dan `lowering/targets/to-*.ts`.
