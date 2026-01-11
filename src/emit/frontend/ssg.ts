import path from "node:path";
import fs from "node:fs";
import { Project } from "ts-morph";
import type { FrontendPage, FrontendComponent } from "../../ir/domain/frontend.js";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";
import type { FrontendPolicy } from "../../ir/target/frontend.policy.js";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export function isInteractiveComponent(component: FrontendComponent): boolean {
  const hasIpcButton = Boolean((component as any).props && (component as any).props["ipcChannel"]);
  return Boolean(
    component.themeToggle ||
    hasIpcButton ||
    (component.form && component.form.fields && component.form.fields.length > 0) ||
    component.layout?.kind === "tabs"
  );
}

export function inferInteractiveRoutes(ir: FrontendTargetIR, policy: FrontendPolicy): string[] {
  if (policy.framework.rendering.mode !== "hybrid") return [];
  // App shell uses interactive theme toggle, so hybrid requires hydration on all routes.
  const appHasInteractivity = true;
  if (appHasInteractivity) return ir.pages.map((page) => page.path);

  const componentMap = new Map(ir.components.map((component) => [component.name, component]));
  const collectRefs = (component: FrontendComponent) => {
    const refs = new Set<string>();
    if (component.layout?.items) {
      component.layout.items.forEach((item) => refs.add(item));
    }
    component.layout?.tabs?.forEach((tab) => {
      tab.items?.forEach((item) => refs.add(item));
    });
    return Array.from(refs);
  };

  const isPageInteractive = (page: FrontendPage) => {
    const queue = [...page.components];
    const visited = new Set<string>();
    while (queue.length) {
      const current = queue.shift();
      if (!current) continue;
      if (isInteractiveComponent(current)) return true;
      for (const ref of collectRefs(current)) {
        if (visited.has(ref)) continue;
        visited.add(ref);
        const child = componentMap.get(ref);
        if (child) queue.push(child);
      }
    }
    return false;
  };

  return ir.pages.filter((page) => isPageInteractive(page)).map((page) => page.path);
}

export function emitSsgSupport(project: Project, outDir: string, frontendDir: string, ir: FrontendTargetIR) {
  const policy = ir.policies.frontend;
  const mode = policy.framework.rendering.mode;

  // Create entry-server.tsx
  const serverEntry = project.createSourceFile(path.join(frontendDir, "entry-server.tsx"), "", { overwrite: true });
  serverEntry.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  serverEntry.addImportDeclaration({ moduleSpecifier: "react-dom/server", namedImports: ["renderToString"] });
  serverEntry.addImportDeclaration({ moduleSpecifier: "react-router-dom/server", namedImports: ["StaticRouter"] });
  serverEntry.addImportDeclaration({ moduleSpecifier: "./App", namedImports: ["App"] });
  serverEntry.addStatements(`
export function render(url: string) {
  const html = renderToString(
    <React.StrictMode>
      <StaticRouter location={url} basename="${policy.framework.rendering.basePath}">
        <App />
      </StaticRouter>
    </React.StrictMode>
  );
  return { html };
}
  `.trim());

  // Create SSG Template
  const templateHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${ir.pwa?.enabled ? `<link rel="manifest" href="${policy.framework.rendering.basePath.replace(/\/$/, "")}/manifest.webmanifest" />` : ""}
    ${ir.pwa?.enabled ? `<meta name="theme-color" content="${ir.pwa.themeColor}" />` : ""}
    <!--app-head-->
    <title>${ir.appName}</title>
  </head>
  <body>
    <div id="root" data-irgen-interactive="false"><!--app-html--></div>
  </body>
</html>
  `.trim();

  const scriptDir = path.join(outDir, "scripts");
  ensureDir(scriptDir);
  fs.writeFileSync(path.join(outDir, "ssg-template.html"), templateHtml, "utf-8");

  // Create Prerender Script
  const prerenderRoutes = policy.framework.rendering.prerender.routes === "auto"
    ? ir.pages.map((p) => p.path)
    : policy.framework.rendering.prerender.routes;
  const interactiveRoutes = inferInteractiveRoutes(ir, policy);
  const prerenderScript = `
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.resolve(rootDir, "${policy.framework.rendering.prerender.outDir}");
const routes = ${JSON.stringify(prerenderRoutes)};
const interactiveRoutes = new Set(${JSON.stringify(interactiveRoutes)});
const mode = "${mode}";
const emitSitemap = ${policy.framework.rendering.prerender.emitSitemap};
const emitRobotsTxt = ${policy.framework.rendering.prerender.emitRobotsTxt};
const siteUrl = process.env.SITE_URL || "http://localhost";

function isDynamicRoute(route) {
  return route.includes(":") || route.includes("*");
}

function routeToFilePath(route) {
  if (route === "/") return "index.html";
  const normalized = route.replace(/^\\//, "").replace(/\\/$/, "");
  return path.join(normalized, "index.html");
}

function readManifest() {
  const manifestPath = path.join(outDir, ".vite", "manifest.json");
  const fallbackPath = path.join(outDir, "manifest.json");
  const target = fs.existsSync(manifestPath) ? manifestPath : fallbackPath;
  if (!fs.existsSync(target)) return null;
  return JSON.parse(fs.readFileSync(target, "utf-8"));
}

function resolveEntry(manifest) {
  if (!manifest) return null;
  return manifest["src/entry-client.tsx"]
    || manifest["index.html"]
    || Object.values(manifest).find((entry) => entry && entry.isEntry);
}

function buildHead(entry, manifest, shouldHydrate) {
  if (!entry) return "";
  const tags = [];
  const base = "${policy.framework.rendering.basePath}".replace(/\\/$/, "");
  if (entry.css) {
    for (const css of entry.css) {
      tags.push(\`<link rel="stylesheet" href="\${base}/\${css}">\`);
    }
  }
  if (shouldHydrate && entry.imports) {
    for (const imp of entry.imports) {
      const file = manifest?.[imp]?.file ?? null;
      if (file) tags.push(\`<link rel="modulepreload" href="\${base}/\${file}">\`);
    }
  }
  if (shouldHydrate && entry.file) {
    tags.push(\`<script type="module" src="\${base}/\${entry.file}"></script>\`);
  }
  return tags.join("\\n    ");
}

async function prerender() {
  const templatePath = path.join(rootDir, "ssg-template.html");
  const template = fs.readFileSync(templatePath, "utf-8");

  const manifest = readManifest();
  const entry = resolveEntry(manifest);
  const { render } = await import(path.join(rootDir, ".ssg", "entry-server.js"));

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const spaFallback = path.join(outDir, "index.html");
  if (fs.existsSync(spaFallback)) {
    fs.copyFileSync(spaFallback, path.join(outDir, "index.spa.html"));
  }

  for (const route of routes) {
    if (isDynamicRoute(route)) {
      console.warn(\`Skipping dynamic route: \${route}\`);
      continue;
    }
    const interactive = interactiveRoutes.has(route) && mode === "hybrid";
    const { html } = render(route);
    const head = buildHead(entry, manifest, interactive);
    const finalHtml = template
      .replace("<!--app-head-->", head)
      .replace("<!--app-html-->", html)
      .replace('data-irgen-interactive="false"', \`data-irgen-interactive="\${interactive}"\`);
    const outFile = path.join(outDir, routeToFilePath(route));
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, finalHtml, "utf-8");
  }

  const base = "${policy.framework.rendering.basePath}".replace(/\\/$/, "");
  if (emitSitemap) {
    const urls = routes
      .filter((r) => !isDynamicRoute(r))
      .map((route) => {
        const fullPath = (base + route).replace(/\\/\\//g, "/");
        return \`  <url><loc>\${new URL(fullPath, siteUrl).href}</loc></url>\`;
      })
      .join("\\n");
    const sitemap = \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
\${urls}
</urlset>\`;
    fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap, "utf-8");
  }

  if (emitRobotsTxt) {
    const sitemapUrl = emitSitemap ? new URL((base + "/sitemap.xml").replace(/\\/\\//g, "/"), siteUrl).href : null;
    const robotsTxt = \`User-agent: *
Allow: \${base || "/"}
\${sitemapUrl ? "\\nSitemap: " + sitemapUrl : ""}\`;
    fs.writeFileSync(path.join(outDir, "robots.txt"), robotsTxt, "utf-8");
  }
}

prerender().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
  `.trim();

  fs.writeFileSync(path.join(scriptDir, "prerender.mjs"), prerenderScript, "utf-8");
}
