import path from "node:path";
import fs from "node:fs";
import { Project, QuoteKind, IndentationText, ScriptTarget } from "ts-morph";
import type { FrontendPage, FrontendComponent } from "../../ir/domain/frontend.js";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";
import { emitterEngine } from "../engine.js";
import { registerTargetEmitter } from "../registry.js";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function emitFrontendPackageJson(outDir: string, ir: FrontendTargetIR) {
  const pkg: any = {
    name: ir?.appName ? `${ir.appName.toLowerCase()}-frontend` : "generated-frontend",
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      format: "prettier --write .",
      "build:css": "tailwindcss -i src/index.css -o dist/index.css --minify",
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "lucide-react": "^0.263.1",
      "react-router-dom": "^6.14.0",
    },
    devDependencies: {
      "@types/react": "^18.0.0",
      "@types/react-dom": "^18.0.0",
      tailwindcss: "^3.3.0",
      postcss: "^8.4.0",
      autoprefixer: "^10.4.0",
      "@tailwindcss/forms": "^0.5.0",
      prettier: "^2.8.8",
      typescript: "^5.6.3",
      tsx: "^4.19.2",
      vite: "^5.4.8",
      "@vitejs/plugin-react": "^4.3.2",
    },
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");
}

function emitPwaAssets(outDir: string, ir: FrontendTargetIR) {
  if (!ir.pwa?.enabled) return;

  const pwa = ir.pwa;
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
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
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
const CACHE_NAME = "ir-codegen-pwa-v1";
const ASSETS = ["/", "/index.html", "/manifest.webmanifest"];

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
      }).catch(() => caches.match("/index.html"));
    })
  );
});
  `.trim();

  fs.writeFileSync(path.join(publicDir, "pwa-sw.js"), sw, "utf-8");
}

function emitViteConfig(project: Project, outDir: string) {
  const config = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  publicDir: "public",
});
  `.trim();

  project.createSourceFile(path.join(outDir, "vite.config.ts"), config, { overwrite: true });
}

export function emitFrontend(project: Project, outDir: string, ir: FrontendTargetIR) {
  const frontendDir = path.join(outDir, "src");
  ensureDir(frontendDir);

  emitFrontendPackageJson(outDir, ir);
  emitPwaAssets(outDir, ir);
  emitViteConfig(project, outDir);

  // index file (Entry Point)
  const idx = project.createSourceFile(path.join(frontendDir, "index.tsx"), "", { overwrite: true });
  idx.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  idx.addImportDeclaration({ moduleSpecifier: "react-dom/client", defaultImport: "ReactDOM" });
  idx.addImportDeclaration({ moduleSpecifier: "./index.css" });
  idx.addImportDeclaration({ moduleSpecifier: "./App", namedImports: ["App"] });

  idx.addStatements(`
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
  `.trim());

  if (ir.pwa?.enabled) {
    idx.addStatements(`
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/pwa-sw.js').catch(err => {
      console.error('Service worker registration failed', err);
    });
  });
}
    `.trim());
  }

  // App.tsx (Router)
  const appFile = project.createSourceFile(path.join(frontendDir, "App.tsx"), "", { overwrite: true });
  appFile.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  appFile.addImportDeclaration({ moduleSpecifier: "react-router-dom", namedImports: ["BrowserRouter", "Routes", "Route", "Link"] });

  // Import all pages
  ir.pages.forEach(p => {
    appFile.addImportDeclaration({ moduleSpecifier: `./pages/${p.name.toLowerCase()}`, namedImports: [`${p.name}Page`] });
  });

  const appFn = appFile.addFunction({ name: "App", isExported: true });

  appFn.setBodyText(writer => {
    writer.writeLine("return (");
    writer.writeLine("    <BrowserRouter>");
    writer.writeLine("      <div className=\"min-h-screen bg-gray-50\">");

    // Navigation Bar
    writer.writeLine("        <nav className=\"bg-white shadow-sm\">");
    writer.writeLine("          <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">");
    writer.writeLine("            <div className=\"flex justify-between h-16\">");
    writer.writeLine("              <div className=\"flex\">");
    writer.writeLine("                <div className=\"flex-shrink-0 flex items-center\">");
    writer.writeLine(`                  <span className=\"font-bold text-xl text-indigo-600\">${ir.appName}</span>`);
    writer.writeLine("                </div>");
    writer.writeLine("                <div className=\"hidden sm:ml-6 sm:flex sm:space-x-8\">");
    ir.pages.forEach(p => {
      writer.writeLine(`                  <Link to=\"${p.path}\" className=\"border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium\">${p.name}</Link>`);
    });
    writer.writeLine("                </div>");
    writer.writeLine("              </div>");
    writer.writeLine("            </div>");
    writer.writeLine("          </div>");
    writer.writeLine("        </nav>");

    // Content Area
    writer.writeLine("        <div className=\"py-10\">");
    writer.writeLine("          <main>");
    writer.writeLine("            <div className=\"max-w-7xl mx-auto sm:px-6 lg:px-8\">");
    writer.writeLine("              <Routes>");
    ir.pages.forEach(p => {
      writer.writeLine(`                <Route path=\"${p.path}\" element={<${p.name}Page />} />`);
    });
    // Default route
    if (ir.pages.length > 0) {
      writer.writeLine(`                <Route path=\"*\" element={<${ir.pages[0].name}Page />} />`);
    }
    writer.writeLine("              </Routes>");
    writer.writeLine("            </div>");
    writer.writeLine("          </main>");
    writer.writeLine("        </div>");

    writer.writeLine("      </div>"); // End min-h-screen
    writer.writeLine("    </BrowserRouter>");
    writer.writeLine("  );");
  });

  // index.html
  project.createSourceFile(path.join(outDir, "index.html"), `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${ir.pwa?.enabled ? `<link rel="manifest" href="/manifest.webmanifest" />` : ""}
    ${ir.pwa?.enabled ? `<meta name="theme-color" content="${ir.pwa.themeColor}" />` : ""}
    <title>${ir.appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
  `.trim(), { overwrite: true });

  // TAILWIND SETUP
  const cssPath = path.join(frontendDir, "index.css");
  project.createSourceFile(cssPath, `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`, { overwrite: true });

  emitTailwindConfig(project, outDir);

  // pages barrel
  const pagesBarrel = project.createSourceFile(path.join(frontendDir, "pages.ts"), "", { overwrite: true });
  pagesBarrel.addStatements([`// Re-exports for generated pages`]);

  // components barrel
  const compsBarrel = project.createSourceFile(path.join(frontendDir, "components.ts"), "", { overwrite: true });
  compsBarrel.addStatements([`// Re-exports for generated components`]);

  for (const p of ir.pages) {
    emitPage(project, frontendDir, p);
    pagesBarrel.addStatements([`export * from "./pages/${p.name.toLowerCase()}";`]);
  }

  for (const c of ir.components) {
    emitComponent(project, frontendDir, c);
    compsBarrel.addStatements([`export * from "./components/${c.name.toLowerCase()}";`]);
  }
}

function emitTailwindConfig(project: Project, outDir: string) {
  // We need to write these to the ROOT of output, not just frontend dir, usually.
  // But let's put them in outDir which is where package.json lives.

  // tailwind.config.js
  project.createSourceFile(path.join(outDir, "tailwind.config.js"), `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
  `.trim(), { overwrite: true });

  // postcss.config.js
  project.createSourceFile(path.join(outDir, "postcss.config.js"), `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
  `.trim(), { overwrite: true });
}

// Register frontend emitter with the engine
try {
  emitterEngine.registerEmitter("frontend-tsmorph", async (ir: FrontendTargetIR, outDir: string) => {
    const project = new Project({
      useInMemoryFileSystem: false,
      manipulationSettings: {
        quoteKind: QuoteKind.Double,
        indentationText: IndentationText.TwoSpaces,
      },
      compilerOptions: { target: ScriptTarget.ES2022 },
    });

    // create/ensure out dir
    fs.mkdirSync(outDir, { recursive: true });

    emitFrontend(project, outDir, ir);
    project.saveSync();
  }, { force: true });
} catch (e) {
  // ignore double registration
}

// register default target mapping
try {
  registerTargetEmitter("frontend", "frontend-tsmorph", { force: true });
} catch (e) {
  // ignore
}

function emitPage(project: Project, frontendDir: string, page: FrontendPage) {
  const dir = path.join(frontendDir, "pages");
  project.createDirectory(dir);
  const filePath = path.join(dir, `${page.name.toLowerCase()}.tsx`);
  const sf = project.createSourceFile(filePath, "", { overwrite: true });

  sf.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  sf.addImportDeclaration({ moduleSpecifier: "react", namedImports: ["useEffect", "useState"] });

  // import referenced components
  for (const c of page.components) {
    sf.addImportDeclaration({ moduleSpecifier: `../components/${c.name.toLowerCase()}`, namedImports: [c.name] });
  }

  const compName = `${page.name}Page`;
  const fn = sf.addFunction({ name: compName, isExported: true });
  fn.setBodyText((writer) => {
    writer.writeLine("return (");
    writer.writeLine("  <div className=\"p-4 space-y-4\">");
    writer.writeLine(`    <h1 className=\"text-2xl font-bold mb-4\">${page.name}</h1>`);
    for (const c of page.components) {
      writer.writeLine(`    <${c.name} />`);
    }
    writer.writeLine("  </div>");
    writer.writeLine(");");
  });
}

function emitComponent(project: Project, frontendDir: string, component: FrontendComponent) {
  const dir = path.join(frontendDir, "components");
  project.createDirectory(dir);
  const filePath = path.join(dir, `${component.name.toLowerCase()}.tsx`);
  const sf = project.createSourceFile(filePath, "", { overwrite: true });

  const needsHooks = !!(component.form && component.form.fields && component.form.fields.length > 0) || (component.layout?.kind === "tabs");
  if (needsHooks) {
    sf.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React", namedImports: ["useEffect", "useState"] });
  } else {
    sf.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  }
  sf.addImportDeclaration({ moduleSpecifier: "lucide-react", namespaceImport: "Icons" });

  // Import layout child components if any
  // Import layout child components if any and valid identifier
  if (component.layout) {
    const childNames = new Set<string>();
    if (component.layout.items) component.layout.items.forEach((c) => childNames.add(c));
    component.layout.tabs?.forEach((t) => t.items?.forEach((c) => childNames.add(c)));
    const isValidIdent = (name: string) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
    for (const childName of childNames) {
      if (childName === component.name) continue; // avoid self-import
      if (!isValidIdent(childName)) continue; // skip placeholder labels
      sf.addImportDeclaration({
        moduleSpecifier: `./${childName.toLowerCase()}`,
        namedImports: [childName],
      });
    }
  }

  const compName = `${component.name}`;
  const fn = sf.addFunction({ name: compName, isExported: true });

  fn.setBodyText((writer) => {
    // Utility classes
    const labelClass = "block text-sm font-medium text-gray-700";
    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
    const checkboxClass = "h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500";
    const radioClass = "h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500";
    const btnClass = "inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";
    const errorClass = "mt-2 text-sm text-red-600";
    const formClass = "space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6";

    // Layout components (real child components)
    if (component.layout) {
      const kind = component.layout.kind;
      if (kind === "tabs") {
        writer.writeLine(`const [active, setActive] = useState(0);`);
        writer.writeLine(`const tabs = [`);
        for (const t of component.layout.tabs ?? []) {
          const validItems = (t.items ?? []).filter((n) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n));
          writer.writeLine(`  { label: "${t.label}", content: ${JSON.stringify(t.content ?? "")}, items: [${validItems.join(", ")}] },`);
        }
        writer.writeLine(`];`);
        writer.writeLine(`return (`);
        writer.writeLine(`  <div className="bg-white shadow rounded-lg">`);
        if (component.layout.title) writer.writeLine(`    <div className="px-4 py-3 border-b"><h3 className="text-lg font-semibold">${component.layout.title}</h3></div>`);
        writer.writeLine(`    <div className="px-4 pt-4 flex space-x-2">`);
        writer.writeLine(`      {tabs.map((t:any, idx:number) => (`);
        writer.writeLine(`        <button key={idx} onClick={() => setActive(idx)} className={\`px-3 py-2 text-sm rounded \${active === idx ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}\`}>{t.label}</button>`);
        writer.writeLine(`      ))}`);
        writer.writeLine(`    </div>`);
        writer.writeLine(`    <div className="px-4 py-4">`);
        writer.writeLine(`      {tabs[active] ? (`);
        writer.writeLine(`        <div className="space-y-3">`);
        writer.writeLine(`          {tabs[active].content && <p className="text-gray-700">{tabs[active].content}</p>}`);
        writer.writeLine(`          {tabs[active].items && tabs[active].items.length > 0 ? tabs[active].items.map((Comp: any, idx: number) => {`);
        writer.writeLine(`            return <div key={idx} className="bg-gray-50 rounded p-3"><Comp /></div>;`);
        writer.writeLine(`          }) : (!tabs[active].content && <p className="text-gray-400 text-sm">No tab content.</p>)}`);
        writer.writeLine(`        </div>`);
        writer.writeLine(`      ) : <p className="text-gray-400 text-sm">No tabs configured.</p>}`);
        writer.writeLine(`    </div>`);
        writer.writeLine(`  </div>`);
        writer.writeLine(`);`);
        return;
      } else if (kind === "panel") {
        writer.writeLine(`return (`);
        writer.writeLine(`  <div className="bg-white shadow rounded-lg p-4">`);
        if (component.layout.title) writer.writeLine(`    <h3 className="text-lg font-semibold mb-2">${component.layout.title}</h3>`);
        if (component.layout.items?.length) {
          for (const item of component.layout.items ?? []) {
            if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(item)) {
              writer.writeLine(`    <div className="mb-3"><${item} /></div>`);
            } else {
              writer.writeLine(`    <div className="mb-3 text-gray-500 text-sm">Placeholder: ${item}</div>`);
            }
          }
        } else {
          writer.writeLine(`    <p className="text-gray-500 text-sm">Panel content</p>`);
        }
        writer.writeLine(`  </div>`);
        writer.writeLine(`);`);
        return;
      } else if (kind === "row" || kind === "column") {
        const cols = component.layout.columns ?? 2;
        const grid = kind === "row" ? `grid-cols-${Math.min(4, Math.max(1, cols))}` : "grid-cols-1";
        const validItems = (component.layout.items ?? []).filter((n) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n));
        writer.writeLine(`const items = [${validItems.join(", ")}];`);
        writer.writeLine(`return (`);
        writer.writeLine(`  <div className="bg-white shadow rounded-lg p-4">`);
        if (component.layout.title) writer.writeLine(`    <h3 className="text-lg font-semibold mb-3">${component.layout.title}</h3>`);
        writer.writeLine("    <div className={`grid gap-4 " + grid + "`}>");
        writer.writeLine(`      {items.length ? items.map((Comp: any, idx: number) => (`);
        writer.writeLine(`        <div key={idx} className="border border-dashed border-gray-300 rounded p-3 text-gray-700 text-sm"><Comp /></div>`);        
        writer.writeLine(`      )) : <div className="text-gray-400 text-sm">No items</div>}`);
        writer.writeLine(`    </div>`);
        writer.writeLine(`  </div>`);
        writer.writeLine(`);`);
        return;
      }
    }

    // Non-form content/button components
    if (component.content || component.html || component.button) {
      writer.writeLine(`return (`);
      writer.writeLine(`  <div className="p-4 bg-white shadow rounded-lg space-y-3">`);
      if (component.content) writer.writeLine(`    <p className="text-gray-700">${component.content}</p>`);
      if (component.html) writer.writeLine(`    <div className="prose" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(component.html)} }} />`);
      if (component.button) {
        const variant = component.button.variant ?? "primary";
        const baseBtn = "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
        const variantClass = variant === "secondary"
          ? "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300"
          : (variant === "ghost"
            ? "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-200"
            : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500");
        writer.writeLine(`    <button className="${baseBtn} ${variantClass}" onClick={() => { /* TODO: wire action */ }}>`);
        if (component.button.icon) {
          writer.writeLine(`      {(Icons as any)["${component.button.icon}"] && React.createElement((Icons as any)["${component.button.icon}"], { size: 16, className: "mr-2" })}`);
        }
        writer.writeLine(`      ${component.button.label}`);
        writer.writeLine(`    </button>`);
      }
      writer.writeLine(`  </div>`);
      writer.writeLine(`);`);
      return;
    }

    if (component.form && component.form.fields && component.form.fields.length > 0) {
      // 1. STATE DEFINITIONS
      const stateVars: string[] = [];
      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        stateVars.push(varName);
        const initialVal =
          f.type === "checkbox" ? "false /* boolean */" :
            (f.type === "select" && f.multiple) ? "[]" :
              (f.type === "tags" ? "[]" :
                (f.type === "file" && f.multiple ? "[]" :
                  (f.type === "file" ? "null" :
                    (f.type === "daterange" ? "{ start: \"\", end: \"\" }" :
                      "\"\""))));
        writer.writeLine(`const [${varName}, set_${varName}] = useState(${initialVal});`);

        if (f.dataSource) {
          writer.writeLine(`const [options_${varName}, setOptions_${varName}] = useState<{label:string, value:string}[]>([]);`);
          writer.writeLine(`const [loading_${varName}, setLoading_${varName}] = useState(false);`);
          writer.writeLine(`const [error_${varName}, setError_${varName}] = useState<string | null>(null);`);
          writer.writeLine(`const [search_${varName}, setSearch_${varName}] = useState("");`);
          writer.writeLine(`const [page_${varName}, setPage_${varName}] = useState(1);`);
          writer.writeLine(`const [hasMore_${varName}, setHasMore_${varName}] = useState(true);`);
        }
      }

      writer.writeLine(`const [errors, set_errors] = useState({} as Record<string,string>);`);
      writer.writeLine(`const ctx = { ${stateVars.map(s => `${s}: ${s}`).join(", ")} };`);
      writer.writeLine(`const getByPath = (obj: any, path?: string) => { if (!path) return undefined; return path.split(".").reduce((acc, key) => (acc && typeof acc === "object") ? acc[key] : undefined, obj); };`);
      writer.writeLine(`const evalLogic = (logic: any, fallback?: any, logicCtx: any = ctx): any => {`);
      writer.writeLine(`  const evalNode = (node: any): any => {`);
      writer.writeLine(`    if (node === undefined || node === null) return undefined;`);
      writer.writeLine(`    if (typeof node === "string") {`);
      writer.writeLine(`      const trimmed = node.trim();`);
      writer.writeLine(`      try { const parsed = JSON.parse(trimmed); if (parsed && typeof parsed === "object") return evalNode(parsed); } catch (_) {}`);
      writer.writeLine(`      const match = trimmed.match(/^([A-Za-z0-9_\\.]+)\\s*(==|===|!=|!==|>=|<=|>|<)\\s*(.+)$/);`);
      writer.writeLine(`      if (match) {`);
      writer.writeLine(`        const [, lhsKey, opSym, rhsRaw] = match;`);
      writer.writeLine(`        const lhs = getByPath(logicCtx, lhsKey);`);
      writer.writeLine(`        let rhs: any = rhsRaw;`);
      writer.writeLine(`        if (rhsRaw === "true") rhs = true; else if (rhsRaw === "false") rhs = false; else if (!isNaN(Number(rhsRaw))) rhs = Number(rhsRaw); else rhs = rhsRaw.replace(/^['"]|['"]$/g, "");`);
      writer.writeLine(`        switch (opSym) {`);
      writer.writeLine(`          case "==": return lhs == rhs;`);
      writer.writeLine(`          case "===": return lhs === rhs;`);
      writer.writeLine(`          case "!=": return lhs != rhs;`);
      writer.writeLine(`          case "!==": return lhs !== rhs;`);
      writer.writeLine(`          case ">": return lhs > rhs;`);
      writer.writeLine(`          case "<": return lhs < rhs;`);
      writer.writeLine(`          case ">=": return lhs >= rhs;`);
      writer.writeLine(`          case "<=": return lhs <= rhs;`);
      writer.writeLine(`        }`);
      writer.writeLine(`      }`);
      writer.writeLine(`      return getByPath(logicCtx, trimmed) ?? trimmed;`);
      writer.writeLine(`    }`);
      writer.writeLine(`    if (Array.isArray(node)) return node.map(evalNode);`);
      writer.writeLine(`    if (typeof node !== "object") return node;`);
      writer.writeLine(`    const entries = Object.entries(node); if (entries.length === 0) return undefined;`);
      writer.writeLine(`    const [op, valRaw] = entries[0];`);
      writer.writeLine(`    const list = Array.isArray(valRaw) ? valRaw : [valRaw];`);
      writer.writeLine(`    const values = list.map(evalNode);`);
      writer.writeLine(`    switch (op) {`);
      writer.writeLine(`      case "var": return getByPath(logicCtx, values[0]);`);
      writer.writeLine(`      case "==": return values[0] == values[1];`);
      writer.writeLine(`      case "===": return values[0] === values[1];`);
      writer.writeLine(`      case "!=": return values[0] != values[1];`);
      writer.writeLine(`      case "!==": return values[0] !== values[1];`);
      writer.writeLine(`      case ">": return values[0] > values[1];`);
      writer.writeLine(`      case "<": return values[0] < values[1];`);
      writer.writeLine(`      case ">=": return values[0] >= values[1];`);
      writer.writeLine(`      case "<=": return values[0] <= values[1];`);
      writer.writeLine(`      case "and": return values.every(Boolean);`);
      writer.writeLine(`      case "or": return values.some(Boolean);`);
      writer.writeLine(`      case "!": return !values[0];`);
      writer.writeLine(`      case "!!": return !!values[0];`);
      writer.writeLine(`      case "if": return values[0] ? values[1] : values[2];`);
      writer.writeLine(`      case "in": return Array.isArray(values[1]) ? values[1].includes(values[0]) : false;`);
      writer.writeLine(`      case "+": return values.reduce((a,b) => (Number(a) || 0) + (Number(b) || 0), 0);`);
      writer.writeLine(`      case "-": return values.length === 1 ? -(Number(values[0]) || 0) : (Number(values[0]) || 0) - (Number(values[1]) || 0);`);
      writer.writeLine(`      case "*": return values.reduce((a,b) => (Number(a) || 0) * (Number(b) || 0), 1);`);
      writer.writeLine(`      case "/": return values.length === 1 ? (Number(values[0]) || 0) : (Number(values[1]) ? (Number(values[0]) || 0) / (Number(values[1]) || 1) : undefined);`);
      writer.writeLine(`      case "%": return values.length === 1 ? Number(values[0]) % 1 : (Number(values[0]) || 0) % (Number(values[1]) || 1);`);
      writer.writeLine(`      default: return undefined;`);
      writer.writeLine(`    }`);
      writer.writeLine(`  };`);
      writer.writeLine(`  const res = evalNode(logic);`);
      writer.writeLine(`  return (typeof res === "undefined") ? fallback : res;`);
      writer.writeLine(`};`);
      writer.writeLine(`const getFieldVal = (field: string) => getByPath(ctx, field.replace(/[^a-zA-Z0-9_]/g, "_"));`);
      writer.writeLine(`const isEmptyVal = (v: any): boolean => {`);
      writer.writeLine(`  if (Array.isArray(v)) return v.length === 0;`);
      writer.writeLine(`  if (typeof v === "object" && v !== null) { const vals = Object.values(v); return vals.length === 0 ? true : vals.every(isEmptyVal); }`);
      writer.writeLine(`  if (typeof v === "boolean") return !v;`);
      writer.writeLine(`  return (!v || v.toString().trim() === "");`);
      writer.writeLine(`};`);

      // 2. EFFECTS (Data Fetching, defaults, computed)
      for (const f of component.form.fields) {
        if (f.dataSource) {
          const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
          const searchParam = f.dataSource.searchParam ?? "q";
          const pageParam = f.dataSource.pageParam ?? "page";
          const pageSizeParam = f.dataSource.pageSizeParam ?? "pageSize";
          const pageSize = f.dataSource.pageSize ?? 20;
          const debounceMs = f.dataSource.debounceMs ?? 300;
          writer.writeLine(`useEffect(() => {`);
          writer.writeLine(`  const handle = setTimeout(() => {`);
          writer.writeLine(`  setLoading_${varName}(true); setError_${varName}(null);`);
          writer.writeLine(`  const url = new URL("${f.dataSource.url}", window.location.origin);`);
          writer.writeLine(`  url.searchParams.set("${searchParam}", search_${varName});`);
          writer.writeLine(`  url.searchParams.set("${pageParam}", String(page_${varName}));`);
          writer.writeLine(`  url.searchParams.set("${pageSizeParam}", String(${pageSize}));`);
          writer.writeLine(`  fetch(url.toString())`);
          writer.writeLine(`    .then(r => r.json())`);
          writer.writeLine(`    .then(data => {`);
          writer.writeLine(`      const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);`);
          writer.writeLine(`      setOptions_${varName}(arr.map((item: any) => ({ label: item["${f.dataSource.labelKey}"], value: item["${f.dataSource.valueKey}"] })));`);
          writer.writeLine(`      setHasMore_${varName}(arr.length >= ${pageSize});`);
          writer.writeLine(`    })`);
          writer.writeLine(`    .catch(err => setError_${varName}(err?.message ?? "Failed to load options"))`);
          writer.writeLine(`    .finally(() => setLoading_${varName}(false));`);
          writer.writeLine(`  }, ${debounceMs});`);
          writer.writeLine(`  return () => clearTimeout(handle);`);
          writer.writeLine(`}, [search_${varName}, page_${varName}]);`);
        }

        if (f.defaultValue) {
          const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
          writer.writeLine(`useEffect(() => { const v = evalLogic(${JSON.stringify(f.defaultValue)}, ${varName}); if (typeof v !== "undefined" && ${varName} === "" ) set_${varName}(v); }, []);`);
        }

        if (f.computeValue) {
          const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
          writer.writeLine(`useEffect(() => { const next = evalLogic(${JSON.stringify(f.computeValue)}, ${varName}); if (typeof next !== "undefined" && next !== ${varName}) set_${varName}(next); }, [${stateVars.join(", ")}]);`);
        }
      }

      // 3. VALIDATION
      writer.writeLine(`const validate = () => {`);
      writer.writeLine(`  const n: Record<string,string> = {};`);

      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        const hasReq = (f.validators && f.validators.required) ? 'true' : 'false';
        const requiredExpr = (f.validators as any)?.requiredIf ? JSON.stringify((f.validators as any).requiredIf) : 'undefined';
        writer.writeLine(`  if (${hasReq}) {`);
        writer.writeLine(`    const v = ${varName};`);
        writer.writeLine(`    if (isEmptyVal(v)) n["${f.name}"] = "${(f.label ?? f.name)} is required";`);
        writer.writeLine(`  }`);
        writer.writeLine(`  if (!n["${f.name}"] && ${requiredExpr} !== undefined) {`);
        writer.writeLine(`    const requiredDyn = evalLogic(${requiredExpr}, false);`);
        writer.writeLine(`    if (requiredDyn) { const v = ${varName}; if (isEmptyVal(v)) n["${f.name}"] = "${(f.label ?? f.name)} is required"; }`);
        writer.writeLine(`  }`);
        if (f.type === "number") {
          const minVal = (f.validators && typeof f.validators.min !== 'undefined') ? f.validators.min : null;
          if (minVal !== null) {
            writer.writeLine(`  if (!n["${f.name}"] && Number(${varName}) < ${minVal}) n["${f.name}"] = "${(f.label ?? f.name)} must be >= ${minVal}";`);
          }
          const maxVal = (f.validators && typeof f.validators.max !== 'undefined') ? f.validators.max : null;
          if (maxVal !== null) {
            writer.writeLine(`  if (!n["${f.name}"] && Number(${varName}) > ${maxVal}) n["${f.name}"] = "${(f.label ?? f.name)} must be <= ${maxVal}";`);
          }
        }
        const minLen = (f.validators && typeof f.validators.minLength !== 'undefined') ? f.validators.minLength : null;
        if (minLen !== null) {
          writer.writeLine(`  if (!n["${f.name}"] && ${varName}.toString().length < ${minLen}) n["${f.name}"] = "${(f.label ?? f.name)} must have length >= ${minLen}";`);
        }
        const maxLen = (f.validators && typeof f.validators.maxLength !== 'undefined') ? f.validators.maxLength : null;
        if (maxLen !== null) {
          writer.writeLine(`  if (!n["${f.name}"] && ${varName}.toString().length > ${maxLen}) n["${f.name}"] = "${(f.label ?? f.name)} must have length <= ${maxLen}";`);
        }
        if (f.validators && f.validators.pattern) {
          writer.writeLine(`  if (!n["${f.name}"]) { try { const re = new RegExp(${JSON.stringify(f.validators.pattern)}); if (!re.test(${varName}.toString())) n["${f.name}"] = "${(f.label ?? f.name)} is invalid"; } catch (_) {} }`);
        }
        if ((f.type === "date" || f.type === "datetime" || f.type === "daterange") && f.validators) {
          if (typeof f.validators.minDate !== "undefined") {
            writer.writeLine(`  if (!n["${f.name}"]) {`);
            writer.writeLine(`    const applyCheck = (val: any) => { const d = Date.parse(val); const min = Date.parse("${f.validators.minDate}"); return (!isNaN(d) && !isNaN(min) && d < min); };`);
            writer.writeLine(`    const fail = ${f.type === "daterange" ? `applyCheck(${varName}.start) || applyCheck(${varName}.end)` : `applyCheck(${varName})`};`);
            writer.writeLine(`    if (fail) n["${f.name}"] = "${(f.label ?? f.name)} must be after ${f.validators.minDate}";`);
            writer.writeLine(`  }`);
          }
          if (typeof f.validators.maxDate !== "undefined") {
            writer.writeLine(`  if (!n["${f.name}"]) {`);
            writer.writeLine(`    const applyCheck = (val: any) => { const d = Date.parse(val); const max = Date.parse("${f.validators.maxDate}"); return (!isNaN(d) && !isNaN(max) && d > max); };`);
            writer.writeLine(`    const fail = ${f.type === "daterange" ? `applyCheck(${varName}.start) || applyCheck(${varName}.end)` : `applyCheck(${varName})`};`);
            writer.writeLine(`    if (fail) n["${f.name}"] = "${(f.label ?? f.name)} must be before ${f.validators.maxDate}";`);
            writer.writeLine(`  }`);
          }
        }
        if (f.validators && f.validators.format === "email") {
          writer.writeLine(`  if (!n["${f.name}"] && ${varName}) { const re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/; if (!re.test(${varName}.toString())) n["${f.name}"] = "${(f.label ?? f.name)} must be a valid email"; }`);
        }
        if (f.validators && f.validators.format === "url") {
          writer.writeLine(`  if (!n["${f.name}"] && ${varName}) { try { new URL(${varName}.toString()); } catch (_) { n["${f.name}"] = "${(f.label ?? f.name)} must be a valid URL"; } }`);
        }
        if (f.validators && f.validators.equalsField) {
          writer.writeLine(`  if (!n["${f.name}"]) { const other = getFieldVal("${f.validators.equalsField}"); if (${varName} != other) n["${f.name}"] = "${(f.label ?? f.name)} must match ${f.validators.equalsField}"; }`);
        }
        if (f.validators && f.validators.notEqualsField) {
          writer.writeLine(`  if (!n["${f.name}"]) { const other = getFieldVal("${f.validators.notEqualsField}"); if (${varName} == other) n["${f.name}"] = "${(f.label ?? f.name)} must differ from ${f.validators.notEqualsField}"; }`);
        }
        if (f.validators && f.validators.greaterThanField) {
          writer.writeLine(`  if (!n["${f.name}"]) { const other = getFieldVal("${f.validators.greaterThanField}"); const lhs = Number(${varName}); const rhs = Number(other); if (!isNaN(lhs) && !isNaN(rhs) && lhs <= rhs) n["${f.name}"] = "${(f.label ?? f.name)} must be greater than ${f.validators.greaterThanField}"; }`);
        }
        if (f.validators && f.validators.lessThanField) {
          writer.writeLine(`  if (!n["${f.name}"]) { const other = getFieldVal("${f.validators.lessThanField}"); const lhs = Number(${varName}); const rhs = Number(other); if (!isNaN(lhs) && !isNaN(rhs) && lhs >= rhs) n["${f.name}"] = "${(f.label ?? f.name)} must be less than ${f.validators.lessThanField}"; }`);
        }
        if (f.validators && Array.isArray(f.validators.custom)) {
          writer.writeLine(`  if (!n["${f.name}"]) {`);
          writer.writeLine(`    for (const rule of ${JSON.stringify(f.validators.custom)}) {`);
          writer.writeLine(`      const ok = evalLogic(rule.logic, false);`);
          writer.writeLine(`      if (!ok) { n["${f.name}"] = rule.message || "${(f.label ?? f.name)} is invalid"; break; }`);
          writer.writeLine(`    }`);
          writer.writeLine(`  }`);
        }
        if (f.validators && Array.isArray(f.validators.uniqueIn) && f.validators.uniqueIn.length > 0) {
          writer.writeLine(`  if (!n["${f.name}"] && ${JSON.stringify(f.validators.uniqueIn)}.includes(${varName})) { n["${f.name}"] = "${(f.label ?? f.name)} must be unique"; }`);
        }
      }

      writer.writeLine(`  set_errors(n);`);
      writer.writeLine(`  return Object.keys(n).length === 0;`);
      writer.writeLine(`};`);

      writer.writeLine(`const [submitting, setSubmitting] = useState(false);`);
      writer.writeLine(`const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);`);
      writer.writeLine(`const [submitError, setSubmitError] = useState<string | null>(null);`);
      if (component.form.submit?.draftKey) {
        writer.writeLine(`useEffect(() => {`);
        writer.writeLine(`  try { const raw = localStorage.getItem("${component.form.submit.draftKey}"); if (raw) { const obj = JSON.parse(raw);`);
        for (const f of component.form.fields) {
          const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
          writer.writeLine(`    if (obj["${varName}"] !== undefined) set_${varName}(obj["${varName}"]);`);
        }
        writer.writeLine(`  } } catch (_) {}`);
        writer.writeLine(`}, []);`);
        writer.writeLine(`useEffect(() => {`);
        writer.writeLine(`  const data = { ${stateVars.map(s => `${s}: ${s}`).join(", ")} };`);
        writer.writeLine(`  try { localStorage.setItem("${component.form.submit.draftKey}", JSON.stringify(data)); } catch (_) {}`);
        writer.writeLine(`}, [${stateVars.join(", ")}]);`);
      }
      writer.writeLine(`const onSubmit = async (e: any) => { e.preventDefault(); setSubmitSuccess(null); setSubmitError(null);`);
      if (component.form.submit?.confirmMessage) {
        writer.writeLine(`  if (!window.confirm(${JSON.stringify(component.form.submit.confirmMessage)})) return;`);
      }
      writer.writeLine(`  if (!validate()) return;`);
      writer.writeLine(`  const payload = { ${stateVars.map(s => `${s}: ${s}`).join(", ")} };`);
      writer.writeLine(`  if (${component.form.submit?.beforeSubmit ? "true" : "false"}) {`);
      writer.writeLine(`    const hookCtx = { ...ctx, payload };`);
      writer.writeLine(`    const shouldContinue = evalLogic(${component.form.submit?.beforeSubmit ? JSON.stringify(component.form.submit.beforeSubmit) : "null"}, true, hookCtx);`);
      writer.writeLine(`    if (shouldContinue === false) { setSubmitError("Submission cancelled"); return; }`);
      writer.writeLine(`  }`);
      writer.writeLine(`  if (!${component.form.submit ? "true" : "false"}) { setSubmitSuccess("Saved (mock)"); return; }`);
      writer.writeLine(`  setSubmitting(true);`);
      writer.writeLine(`  try {`);
      writer.writeLine(`    const res = await fetch("${component.form.submit?.url ?? ""}", { method: "${component.form.submit?.method ?? "POST"}", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });`);
      writer.writeLine(`    if (!res.ok) throw new Error("Submit failed");`);
      writer.writeLine(`    setSubmitSuccess(${component.form.submit?.successMessage ? JSON.stringify(component.form.submit.successMessage) : `"Saved"`});`);
      writer.writeLine(`    const hookCtx = { ...ctx, payload, response: await res.clone().json().catch(() => null) };`);
      if (component.form.submit?.onSuccess) {
        writer.writeLine(`    evalLogic(${JSON.stringify(component.form.submit.onSuccess)}, undefined, hookCtx);`);
      }
      if (component.form.submit?.redirect) {
        writer.writeLine(`    window.location.href = ${JSON.stringify(component.form.submit.redirect)};`);
      }
      writer.writeLine(`  } catch (err: any) {`);
      writer.writeLine(`    setSubmitError(${component.form.submit?.errorMessage ? JSON.stringify(component.form.submit.errorMessage) : `"Submit error"`});`);
      writer.writeLine(`    const hookCtx = { ...ctx, payload, error: err?.message ?? err };`);
      if (component.form.submit?.onError) {
        writer.writeLine(`    evalLogic(${JSON.stringify(component.form.submit.onError)}, undefined, hookCtx);`);
      }
      writer.writeLine(`  } finally {`);
      if (component.form.submit?.afterSubmit) {
        writer.writeLine(`    const hookCtx = { ...ctx, payload };`);
        writer.writeLine(`    evalLogic(${JSON.stringify(component.form.submit.afterSubmit)}, undefined, hookCtx);`);
      }
      writer.writeLine(`    setSubmitting(false);`);
      writer.writeLine(`  }`);
      writer.writeLine(`};`);

      // 4. RENDER
      writer.writeLine(`return (`);
      writer.writeLine(`  <form className=\"${formClass}\" onSubmit={onSubmit}>`);

      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        const label = f.label ?? f.name;

        const visibleExpr = f.visibleIf ? JSON.stringify(f.visibleIf) : undefined;
        writer.writeLine(`    {(() => {`);
        if (visibleExpr) {
          writer.writeLine(`      const visible = evalLogic(${visibleExpr}, true);`);
          writer.writeLine(`      if (!visible) return null;`);
        }
        const disabledExpr = f.disabledIf ? JSON.stringify(f.disabledIf) : undefined;
        writer.writeLine(`      const disabledVal = ${disabledExpr ? `evalLogic(${disabledExpr}, false)` : "false"};`);

        writer.writeLine(`      return (`);
        writer.writeLine(`    <div className="${f.className ?? ""}">`);
        writer.writeLine(`      <div className="flex items-center gap-2">`);
        writer.writeLine(`        <label className=\"${labelClass}\">${label}</label>`);
        if (f.tooltip) {
          writer.writeLine(`        <span className="text-gray-400" title="${f.tooltip}">ℹ️</span>`);
        }
        writer.writeLine(`      </div>`);

        // Icon wrapper
        if (f.icon) {
          writer.writeLine(`      <div className="relative mt-1 rounded-md shadow-sm">`);
          writer.writeLine(`        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">`);
          writer.writeLine(`          {(Icons as any)["${f.icon}"] && React.createElement((Icons as any)["${f.icon}"], { size: 16, className: "text-gray-400" })}`);
          writer.writeLine(`        </div>`);
        } else {
          writer.writeLine(`      <div className="${(f.prefix || f.suffix) ? "relative mt-1" : "mt-1"}">`);
        }

        const baseInput = f.className ? `${inputClass} ${f.className}` : inputClass;
        const paddedInput = f.icon ? `${baseInput} pl-10` : baseInput;
        const inputClassName = (f.prefix ? `${paddedInput} pl-10` : paddedInput) + (f.suffix ? " pr-10" : "");
        if (f.prefix) {
          writer.writeLine(`        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm pointer-events-none">${f.prefix}</span>`);
        }

        if (f.type === "select") {
          if (f.dataSource) {
            writer.writeLine(`        {loading_${varName} && <div className="animate-pulse space-y-2 mb-2" aria-busy="true">`);
            writer.writeLine(`          <div className="h-3 bg-gray-200 rounded"></div>`);
            writer.writeLine(`          <div className="h-3 bg-gray-200 rounded w-2/3"></div>`);
            writer.writeLine(`        </div>}`);
            writer.writeLine(`        {error_${varName} && <p className="text-sm text-red-600">{error_${varName}}</p>}`);
            writer.writeLine(`        <input className="${inputClass} mb-2" placeholder="${f.searchPlaceholder ?? "Search..."}" value={search_${varName}} onChange={e => { setSearch_${varName}(e.target.value); setPage_${varName}(1); }} aria-label="${f.ariaLabel ?? label} search" />`);
            writer.writeLine(`        {(() => { const filtered = options_${varName}; return (`);
            writer.writeLine(`          <select className=\"${inputClassName}\" name=\"${f.name}\" ${f.multiple ? "multiple" : ""} value={${f.multiple ? varName : `${varName} || ""`}} onChange={(e) => {`);
            if (f.multiple) {
              writer.writeLine(`            const vals = Array.from(e.target.selectedOptions).map(o => o.value); set_${varName}(vals);`);
            } else {
              writer.writeLine(`            set_${varName}(e.target.value);`);
            }
            writer.writeLine(`          }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" aria-busy={loading_${varName}} aria-invalid={Boolean(errors["${f.name}"])}>`);
            if (!f.multiple) writer.writeLine(`          <option value="">Select...</option>`);
            writer.writeLine(`          {filtered.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}`);
            writer.writeLine(`          </select>`);
            writer.writeLine(`        ); })()}`);
            writer.writeLine(`        <div className="flex items-center gap-2 mt-2">`);
            writer.writeLine(`          <button type="button" className="text-sm text-gray-700 px-2 py-1 border rounded disabled:opacity-50" onClick={() => setPage_${varName}(p => Math.max(1, p - 1))} disabled={page_${varName} <= 1}>Prev</button>`);
            writer.writeLine(`          <span className="text-xs text-gray-500">Page {page_${varName}}</span>`);
            writer.writeLine(`          <button type="button" className="text-sm text-gray-700 px-2 py-1 border rounded disabled:opacity-50" onClick={() => setPage_${varName}(p => hasMore_${varName} ? p + 1 : p)} disabled={!hasMore_${varName}}>Next</button>`);
            if (f.clearable) {
              writer.writeLine(`          <button type="button" className="text-sm text-gray-600 underline" onClick={() => set_${varName}(${f.multiple ? "[]" : '""'})}>Clear</button>`);
            }
            writer.writeLine(`        </div>`);
          } else {
            writer.writeLine(`        <select className=\"${inputClassName}\" name=\"${f.name}\" ${f.multiple ? "multiple" : ""} value={${f.multiple ? varName : `${varName} || ""`}} onChange={(e) => {`);
            if (f.multiple) {
              writer.writeLine(`          const vals = Array.from(e.target.selectedOptions).map(o => o.value); set_${varName}(vals);`);
            } else {
              writer.writeLine(`          set_${varName}(e.target.value);`);
            }
            writer.writeLine(`        }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" aria-invalid={Boolean(errors["${f.name}"])}>`);
            if (!f.multiple) writer.writeLine(`          <option value="">Select...</option>`);
            if (f.options) {
              for (const opt of f.options) {
                writer.writeLine(`          <option value="${opt.value}">${opt.label}</option>`);
              }
            }
            writer.writeLine(`        </select>`);
            if (f.clearable) {
              writer.writeLine(`        <div className="mt-1"><button type="button" className="text-sm text-gray-600 underline" onClick={() => set_${varName}(${f.multiple ? "[]" : '""'})}>Clear</button></div>`);
            }
          }
        } else if (f.type === "tags") {
          writer.writeLine(`        <div className="flex flex-wrap gap-2 mb-2">`);
          writer.writeLine(`          {${varName}.map((tag: string, idx: number) => <span key={idx} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">{tag}<button type="button" onClick={() => set_${varName}(${varName}.filter((_: any,i: number)=>i!==idx))} aria-label="Remove tag">×</button></span>)}`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        <input className="${inputClassName}" placeholder="${f.placeholder ?? "Add tag and press Enter"}" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const val = (e.target as HTMLInputElement).value.trim(); if (val) { set_${varName}([...${varName}, val]); (e.target as HTMLInputElement).value = ""; } } }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
        } else if (f.type === "file") {
          writer.writeLine(`        <input className="${inputClassName}" name="${f.name}" type="file" ${f.accept ? `accept="${f.accept}"` : ""} ${f.multiple ? "multiple" : ""} onChange={(e) => { const files = e.target.files; if (!files) return; ${f.multiple ? `set_${varName}(Array.from(files));` : `set_${varName}(files[0] ?? null);`} }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
        } else if (f.type === "slider") {
          const minVal = (f.validators && typeof f.validators.min !== "undefined") ? f.validators.min : 0;
          const maxVal = (f.validators && typeof f.validators.max !== "undefined") ? f.validators.max : 100;
          const stepVal = f.step ?? 1;
          writer.writeLine(`        <input className="${inputClassName}" type="range" min="${minVal}" max="${maxVal}" step="${stepVal}" value={${varName} || ${minVal}} onChange={(e) => set_${varName}(e.target.value)} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`        <div className="text-xs text-gray-600 mt-1">{${varName} || ${minVal}}</div>`);
        } else if (f.type === "currency") {
          writer.writeLine(`        <div className="flex items-center gap-2">`);
          writer.writeLine(`          <span className="text-gray-600">${f.defaultCurrency ?? "Rp"}</span>`);
          writer.writeLine(`          <input className="${inputClassName}" name="${f.name}" type="number" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} placeholder="${f.placeholder ?? ''}" disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`        </div>`);
        } else if (f.type === "daterange") {
          writer.writeLine(`        <div className="flex gap-2">`);
          writer.writeLine(`          <input className="${inputClassName}" type="date" value={${varName}.start} onChange={(e)=> set_${varName}({...${varName}, start: e.target.value})} disabled={disabledVal} aria-label="${f.ariaLabel ?? label} start" />`);
          writer.writeLine(`          <input className="${inputClassName}" type="date" value={${varName}.end} onChange={(e)=> set_${varName}({...${varName}, end: e.target.value})} disabled={disabledVal} aria-label="${f.ariaLabel ?? label} end" />`);
          writer.writeLine(`        </div>`);
        } else if (f.type === "signature") {
          writer.writeLine(`        <textarea className="${inputClassName}" name="${f.name}" value={${varName}} onChange={(e)=> set_${varName}(e.target.value)} placeholder="${f.placeholder ?? 'Paste signature data...'}" disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
        } else {
          const inputType = (["number","email","password","date","datetime","time","url","phone"].includes(f.type)) ? (f.type === "phone" ? "tel" : f.type) : "text";
          if (f.type === "textarea") {
            writer.writeLine(`        <textarea className=\"${inputClassName}\" name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} placeholder=\"${f.placeholder ?? ''}\" disabled={disabledVal} />`);
          } else if (f.type === "checkbox") {
            writer.writeLine(`        <input className=\"${checkboxClass}\" name=\"${f.name}\" checked={${varName}} onChange={(e) => set_${varName}(e.target.checked)} type="checkbox" disabled={disabledVal} />`);
          } else if (f.type === "radio") {
            if (f.options) {
              writer.writeLine(`        <div className="mt-2 space-y-2">`);
              for (const opt of (f.options ?? [])) {
                writer.writeLine(`          <label className="inline-flex items-center space-x-2">`);
                writer.writeLine(`            <input className="${radioClass}" type="radio" name="${f.name}" value="${opt.value}" checked={${varName} === "${opt.value}"} onChange={(e) => set_${varName}(e.target.value)} disabled={disabledVal} />`);
                writer.writeLine(`            <span>${opt.label}</span>`);
                writer.writeLine(`          </label>`);
              }
              writer.writeLine(`        </div>`);
            } else {
              writer.writeLine(`        <input className=\"${inputClassName}\" name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} type="text" placeholder=\"${f.placeholder ?? ''}\" disabled={disabledVal} />`);
            }
          } else {
            writer.writeLine(`        <input className=\"${inputClassName}\" name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} type=\"${inputType}\" placeholder=\"${f.placeholder ?? ''}\" disabled={disabledVal} />`);
          }
        }

        if (f.suffix) {
          writer.writeLine(`        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 text-sm pointer-events-none">${f.suffix}</span>`);
        }

        writer.writeLine(`      </div>`); // End relative wrapper/mt-1

        if (f.description) {
          writer.writeLine(`      <p className="mt-2 text-sm text-gray-500">${f.description}</p>`);
        }

        writer.writeLine(`      {errors["${f.name}"] && <div className=\"${errorClass}\">{errors["${f.name}"]}</div>}`);
        if (f.helpHtml) {
          writer.writeLine(`      <div className="text-xs text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(f.helpHtml)} }} />`);
        }
        writer.writeLine(`    </div>`);
        writer.writeLine(`      );`);
        writer.writeLine(`    })()}`);
        writer.writeLine("");
      }

      writer.writeLine(`    {submitSuccess && <div className="text-green-600 text-sm">{submitSuccess}</div>}`);
      writer.writeLine(`    {submitError && <div className="text-red-600 text-sm">{submitError}</div>}`);
      writer.writeLine(`    <button className=\"${btnClass}\" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</button>`);
      writer.writeLine(`  </form>`);
      writer.writeLine(`);`);

    } else {
      writer.writeLine(`return (`);
      writer.writeLine(`  <div className=\"p-6 bg-white shadow rounded-lg\">`);
      if (component.entityRef) {
        writer.writeLine(`    <h3 className=\"text-lg font-medium leading-6 text-gray-900\">${component.name}</h3>`);
        writer.writeLine(`    <p className=\"mt-1 text-sm text-gray-500\">Entity: ${component.entityRef}</p>`);
      } else {
        writer.writeLine(`    <h3 className=\"text-lg font-medium leading-6 text-gray-900\">${component.name}</h3>`);
        writer.writeLine(`    <div className=\"mt-4 border-t border-gray-200 pt-4\">`);
        if (component.props) {
          writer.writeLine(`      <dl className=\"grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2\">`);
          for (const [key, type] of Object.entries(component.props)) {
            writer.writeLine(`        <div className=\"sm:col-span-1\">`);
            writer.writeLine(`          <dt className=\"text-sm font-medium text-gray-500\">${key}</dt>`);
            writer.writeLine(`          <dd className=\"mt-1 text-sm text-gray-900\">{${JSON.stringify(type)}}</dd>`); // Escape via JSX expression
            writer.writeLine(`        </div>`);
          }
          writer.writeLine(`      </dl>`);
        }
        writer.writeLine(`    </div>`);
      }
      writer.writeLine(`  </div>`);
      writer.writeLine(`);`);
    }
  });
}
