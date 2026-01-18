import fs from "node:fs";
import path from "node:path";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";
import { ensureDir } from "./frontend-helpers.js";

export function emitPwaAssets(outDir: string, ir: FrontendTargetIR) {
  if (!ir.pwa?.enabled) return;

  const pwa = ir.pwa;
  const basePath = ir.policies.frontend.framework.rendering.basePath || "/";
  const swBasePath = basePath === "/" ? "" : basePath.replace(/\/$/, "");
  const manifestIconPath = basePath === "/" ? "/icons/icon.svg" : `${basePath.replace(/\/$/, "")}/icons/icon.svg`;
  const manifest = {
    name: pwa.name,
    short_name: pwa.shortName,
    description: pwa.description ?? `${ir.appName} PWA`,
    start_url: pwa.startUrl,
    scope: pwa.scope,
    display: pwa.display,
    background_color: pwa.backgroundColor,
    theme_color: pwa.themeColor,
    orientation: pwa.orientation,
    icons: pwa.icons ?? [
      { src: manifestIconPath, sizes: "any", type: "image/svg+xml" },
    ],
  };

  const publicDir = path.join(outDir, "public");
  const iconsDir = path.join(publicDir, "icons");
  ensureDir(iconsDir);
  fs.writeFileSync(path.join(publicDir, "manifest.webmanifest"), JSON.stringify(manifest, null, 2), "utf-8");

  const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${pwa.themeColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${pwa.backgroundColor};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="64" fill="url(#grad)"/>
  <text x="50%" y="55%" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="180" fill="#ffffff" font-weight="700">IR</text>
</svg>
  `.trim();
  fs.writeFileSync(path.join(iconsDir, "icon.svg"), svgIcon, "utf-8");

  const sw = `
const CACHE_NAME = "irgen-pwa-v1";
const ASSETS = [
  "${swBasePath}/",
  "${swBasePath}/index.html",
  "${swBasePath}/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return resp;
      }).catch(() => caches.match("${swBasePath}/index.html"));
    })
  );
});
  `.trim();

  fs.writeFileSync(path.join(publicDir, "pwa-sw.js"), sw, "utf-8");
}
