import path from "node:path";
import fs from "node:fs";
import { Project, QuoteKind, IndentationText, ScriptTarget } from "ts-morph";
import type { FrontendPage, FrontendComponent, FrontendMarketing } from "../../ir/domain/frontend.js";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";
import type { FrontendPolicy } from "../../ir/target/frontend.policy.js";
import { emitterEngine } from "../engine.js";
import { registerTargetEmitter } from "../registry.js";
import { pascal, kebab } from "../../utils/string.js";
import { emitSsgSupport } from "./ssg.js";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function emitFrontendPackageJson(outDir: string, ir: FrontendTargetIR) {
  const policy = ir.policies.frontend;
  const mode = policy.framework.rendering.mode;
  const isSsg = mode === "ssg" || mode === "hybrid";

  const pkg: any = {
    name: ir?.appName ? `${ir.appName.toLowerCase()}-frontend` : "generated-frontend",
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      format: "prettier --write .",
      "build:css": "tailwindcss -i src/index.css -o dist/index.css --minify",
      dev: "vite",
      build: isSsg ? "npm run build:ssg" : "vite build",
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

  if (isSsg) {
    pkg.scripts["build:ssg"] = "vite build && npm run build:ssr && npm run prerender";
    pkg.scripts["build:ssr"] = "vite build --ssr src/entry-server.tsx --outDir .ssg";
    pkg.scripts["prerender"] = "node scripts/prerender.mjs";
  }

  // Add syntax highlighter if needed
  const hasCode = ir.pages.some(p => p.components.some(c => c.codeBlock)) || ir.components.some(c => c.codeBlock);
  if (hasCode) {
    pkg.dependencies["react-syntax-highlighter"] = "^15.5.0";
    pkg.devDependencies["@types/react-syntax-highlighter"] = "^15.5.0";
  }

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
const CACHE_NAME = "irgen-pwa-v1";
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

function emitViteConfig(project: Project, outDir: string, policy: FrontendPolicy) {
  const mode = policy.framework.rendering.mode;
  const isSsg = mode === "ssg" || mode === "hybrid";
  const buildOutDir = policy.framework.rendering.prerender.outDir;

  const config = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  server: { port: 5173 },
  preview: { port: 4173 },
  publicDir: "public",${isSsg ? `
  build: {
    outDir: "${buildOutDir}",
    manifest: true,
  },
  ssr: {
    noExternal: ["react", "react-dom", "react-router", "react-router-dom"],
  },` : ""}
});
  `.trim();

  project.createSourceFile(path.join(outDir, "vite.config.ts"), config, { overwrite: true });
}



export function emitFrontend(project: Project, outDir: string, ir: FrontendTargetIR) {
  const frontendDir = path.join(outDir, "src");
  ensureDir(frontendDir);

  const policy = ir.policies.frontend;
  const mode = policy.framework.rendering.mode;
  const isSsg = mode === "ssg" || mode === "hybrid";

  emitFrontendPackageJson(outDir, ir);
  emitPwaAssets(outDir, ir);
  emitViteConfig(project, outDir, policy);
  emitSharedLogic(project, frontendDir);

  // client entry (CSR + optional hydration for hybrid)
  const clientEntry = project.createSourceFile(path.join(frontendDir, "entry-client.tsx"), "", { overwrite: true });
  clientEntry.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  clientEntry.addImportDeclaration({
    moduleSpecifier: "react-dom/client",
    namedImports: mode === "hybrid" ? ["hydrateRoot", "createRoot"] : ["createRoot"],
  });
  clientEntry.addImportDeclaration({ moduleSpecifier: "react-router-dom", namedImports: ["BrowserRouter"] });
  clientEntry.addImportDeclaration({ moduleSpecifier: "./index.css" });
  clientEntry.addImportDeclaration({ moduleSpecifier: "./App", namedImports: ["App"] });

  if (mode === "hybrid") {
    clientEntry.addStatements(`
const rootElement = document.getElementById('root') as HTMLElement | null;
if (rootElement) {
  const modeFlag = rootElement.dataset.irgenInteractive;
  if (modeFlag === "false") {
    // no hydrate for static-only pages
  } else if (modeFlag === "csr" || !modeFlag) {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  } else {
    hydrateRoot(
      rootElement,
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  }
}
    `.trim());
  } else {
    clientEntry.addStatements(`
const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
    `.trim());
  }

  if (ir.pwa?.enabled) {
    clientEntry.addStatements(`
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/pwa-sw.js').catch(err => {
      console.error('Service worker registration failed', err);
    });
  });
}
    `.trim());
  }

  // compatibility entry for legacy tooling/tests
  project.createSourceFile(
    path.join(frontendDir, "index.tsx"),
    `import "./entry-client";`,
    { overwrite: true },
  );

  if (isSsg) {
    emitSsgSupport(project, outDir, frontendDir, ir);
  }

  // App.tsx
  const appFile = project.createSourceFile(path.join(frontendDir, "App.tsx"), "", { overwrite: true });
  appFile.addImportDeclaration({ moduleSpecifier: "react", namedImports: ["useEffect", "useState"] });
  appFile.addImportDeclaration({ moduleSpecifier: "react-router-dom", namedImports: ["Routes", "Route", "Link"] });
  appFile.addImportDeclaration({ moduleSpecifier: "lucide-react", namespaceImport: "Icons" });

  // Import all pages
  ir.pages.forEach(p => {
    appFile.addImportDeclaration({ moduleSpecifier: `./pages/${kebab(p.name)}`, namedImports: [`${pascal(p.name)}Page`] });
  });

  const appFn = appFile.addFunction({ name: "App", isExported: true });

  appFn.setBodyText(writer => {
    writer.writeLine("const [isDark, setIsDark] = useState(() => {");
    writer.writeLine("  if (typeof window !== 'undefined') {");
    writer.writeLine("    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';");
    writer.writeLine("  }");
    writer.writeLine("  return false;");
    writer.writeLine("});");
    writer.writeLine("");
    writer.writeLine("useEffect(() => {");
    writer.writeLine("  if (isDark) {");
    writer.writeLine("    document.documentElement.classList.add('dark');");
    writer.writeLine("    localStorage.setItem('theme', 'dark');");
    writer.writeLine("  } else {");
    writer.writeLine("    document.documentElement.classList.remove('dark');");
    writer.writeLine("    localStorage.setItem('theme', 'light');");
    writer.writeLine("  }");
    writer.writeLine("}, [isDark]);");
    writer.writeLine("");
    writer.writeLine("return (");
    writer.writeLine("    <div className=\"min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-slate-900 selection:text-white transition-colors duration-300\">");
    writer.writeLine("        {/* Decorative background gradients */}");
    writer.writeLine("        <div className=\"fixed inset-0 -z-10 pointer-events-none opacity-40\">");
    writer.writeLine("          <div className=\"absolute top-0 left-1/4 w-96 h-96 bg-slate-200 rounded-full blur-3xl\"></div>");
    writer.writeLine("          <div className=\"absolute bottom-0 right-1/4 w-96 h-96 bg-slate-100 rounded-full blur-3xl\"></div>");
    writer.writeLine("        </div>");
    writer.writeLine("");
    writer.writeLine("        {/* Navigation Bar - Glassmorphism */}");
    writer.writeLine("        <nav className=\"sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60\">");
    writer.writeLine("          <div className=\"max-w-7xl mx-auto px-6 lg:px-10\">");
    writer.writeLine("            <div className=\"flex justify-between h-20\">");
    writer.writeLine("              <div className=\"flex items-center gap-10\">");
    writer.writeLine("                <div className=\"flex-shrink-0\">");
    writer.writeLine(`                  <Link to=\"/\" className=\"group flex items-center gap-2\">`);
    writer.writeLine(`                    <div className=\"w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 active:scale-95 transition-all\" style={{ backgroundColor: \"${ir.policies.frontend.styling.theme.primaryColor}\" }}>`);
    writer.writeLine(`                      <Icons.Box size={24} />`);
    writer.writeLine(`                    </div>`);
    writer.writeLine(`                    <span className=\"font-black text-2xl tracking-tighter text-slate-900 dark:text-white\">${ir.appName}</span>`);
    writer.writeLine(`                  </Link>`);
    writer.writeLine("                </div>");
    writer.writeLine("                <div className=\"hidden sm:flex items-center gap-1\">");
    ir.pages.forEach(p => {
      writer.writeLine(`                  <Link to=\"${p.path}\" className=\"px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all\">${p.name}</Link>`);
    });
    writer.writeLine("                </div>");
    writer.writeLine("              </div>");
    writer.writeLine("              <div className=\"flex items-center gap-4\">");
    writer.writeLine("                <button className=\"p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors\"><Icons.Search size={20}/></button>");
    writer.writeLine("                <button className=\"p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors\"><Icons.Bell size={20}/></button>");
    writer.writeLine("                <button ");
    writer.writeLine("                  onClick={() => setIsDark(!isDark)}");
    writer.writeLine("                  className=\"p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90\"");
    writer.writeLine("                  aria-label=\"Toggle theme\"");
    writer.writeLine("                >");
    writer.writeLine("                  <div className=\"relative w-5 h-5\">");
    writer.writeLine("                    <Icons.Sun className=\"absolute inset-0 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all text-amber-500\" size={20} />");
    writer.writeLine("                    <Icons.Moon className=\"absolute inset-0 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all text-indigo-400\" size={20} />");
    writer.writeLine("                  </div>");
    writer.writeLine("                </button>");
    writer.writeLine("                <div className=\"w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 overflow-hidden shadow-sm\">");
    writer.writeLine("                   <img src=\"https://i.pravatar.cc/100?u=user\" alt=\"Avatar\" className=\"w-full h-full object-cover\" />");
    writer.writeLine("                </div>");
    writer.writeLine("              </div>");
    writer.writeLine("            </div>");
    writer.writeLine("          </div>");
    writer.writeLine("        </nav>");
    writer.writeLine("");
    writer.writeLine("        {/* Content Area */}");
    writer.writeLine("        <main className=\"max-w-7xl mx-auto px-6 lg:px-10 py-12 md:py-20 animate-in fade-in duration-700\">");
    writer.writeLine("          <Routes>");
    ir.pages.forEach(p => {
      writer.writeLine(`            <Route path=\"${p.path}\" element={<${pascal(p.name)}Page />} />`);
    });
    if (ir.pages.length > 0) {
      writer.writeLine(`            <Route path=\"*\" element={<${pascal(ir.pages[0].name)}Page />} />`);
    }
    writer.writeLine("          </Routes>");
    writer.writeLine("        </main>");
    writer.writeLine("");
    writer.writeLine("        {/* Footer */}");
    writer.writeLine("        <footer className=\"border-t border-slate-200 dark:border-slate-800 mt-20 py-12 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm\">");
    writer.writeLine("          <div className=\"max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-6\">");
    writer.writeLine(`            <div className=\"text-slate-400 dark:text-slate-500 text-sm font-medium\">© 2026 ${ir.appName}. Powered by <span className=\"font-bold text-slate-900 dark:text-white\">irgen</span></div>`);
    writer.writeLine("            <div className=\"flex gap-8 text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest\">");
    writer.writeLine("              <a href=\"#\" className=\"hover:text-slate-900 dark:hover:text-white transition-colors\">Terms</a>");
    writer.writeLine("              <a href=\"#\" className=\"hover:text-slate-900 dark:hover:text-white transition-colors\">Privacy</a>");
    writer.writeLine("              <a href=\"#\" className=\"hover:text-slate-900 dark:hover:text-white transition-colors\">Contact</a>");
    writer.writeLine("            </div>");
    writer.writeLine("          </div>");
    writer.writeLine("        </footer>");
    writer.writeLine("      </div>");
    writer.writeLine("  );");
  });

  // index.html (SPA fallback / CSR entry)
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
    <div id="root" data-irgen-interactive="csr"></div>
    <script type="module" src="/src/entry-client.tsx"></script>
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
    emitComponent(project, frontendDir, c, ir);
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
  darkMode: 'class',
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

function emitSharedLogic(project: Project, srcDir: string) {
  const libDir = path.join(srcDir, "lib");
  ensureDir(libDir);
  const filePath = path.join(libDir, "logic.ts");
  const sf = project.createSourceFile(filePath, "", { overwrite: true });

  sf.addStatements([
    `export const getByPath = (obj: any, path?: string) => { if (!path) return undefined; return path.split(".").reduce((acc, key) => (acc && typeof acc === "object") ? acc[key] : undefined, obj); };`,
    `export const isEmptyVal = (v: any): boolean => {
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object" && v !== null) { const vals = Object.values(v); return vals.length === 0 ? true : vals.every(isEmptyVal); }
  if (typeof v === "boolean") return !v;
  return (!v || v.toString().trim() === "");
};`,
    `export const evalLogic = (logic: any, fallback?: any, logicCtx: any = {}): any => {
  const evalNode = (node: any): any => {
    if (node === undefined || node === null) return undefined;
    if (typeof node === "string") {
      const trimmed = node.trim();
      try { const parsed = JSON.parse(trimmed); if (parsed && typeof parsed === "object") return evalNode(parsed); } catch (_) {}
      const match = trimmed.match(/^([A-Za-z0-9_\\.]+)\\s*(==|===|!=|!==|>=|<=|>|<)\\s*(.+)$/);
      if (match) {
        const [, lhsKey, opSym, rhsRaw] = match;
        const lhs = getByPath(logicCtx, lhsKey);
        let rhs: any = rhsRaw;
        if (rhsRaw === "true") rhs = true; else if (rhsRaw === "false") rhs = false; else if (!isNaN(Number(rhsRaw))) rhs = Number(rhsRaw); else rhs = rhsRaw.replace(/^['"]|['"]$/g, "");
        switch (opSym) {
          case "==": return lhs == rhs;
          case "===": return lhs === rhs;
          case "!=": return lhs != rhs;
          case "!==": return lhs !== rhs;
          case ">": return lhs > rhs;
          case "<": return lhs < rhs;
          case ">=": return lhs >= rhs;
          case "<=": return lhs <= rhs;
        }
      }
      return getByPath(logicCtx, trimmed) ?? trimmed;
    }
    if (Array.isArray(node)) return node.map(evalNode);
    if (typeof node !== "object") return node;
    const entries = Object.entries(node); if (entries.length === 0) return undefined;
    const [op, valRaw] = entries[0];
    const list = Array.isArray(valRaw) ? valRaw : [valRaw];
    const values = list.map(evalNode);
    switch (op) {
      case "var": return getByPath(logicCtx, values[0]);
      case "==": return values[0] == values[1];
      case "===": return values[0] === values[1];
      case "!=": return values[0] != values[1];
      case "!==": return values[0] !== values[1];
      case ">": return values[0] > values[1];
      case "<": return values[0] < values[1];
      case ">=": return values[0] >= values[1];
      case "<=": return values[0] <= values[1];
      case "and": return values.every(Boolean);
      case "or": return values.some(Boolean);
      case "!": return !values[0];
      case "!!": return !!values[0];
      case "if": return values[0] ? values[1] : values[2];
      case "in": return Array.isArray(values[1]) ? values[1].includes(values[0]) : false;
      case "+": return values.reduce((a,b) => (Number(a) || 0) + (Number(b) || 0), 0);
      case "-": return values.length === 1 ? -(Number(values[0]) || 0) : (Number(values[0]) || 0) - (Number(values[1]) || 0);
      case "*": return values.reduce((a,b) => (Number(a) || 0) * (Number(b) || 0), 1);
      case "/": return values.length === 1 ? (Number(values[0]) || 0) : (Number(values[1]) ? (Number(values[0]) || 0) / (Number(values[1]) || 1) : undefined);
      case "%": return values.length === 1 ? Number(values[0]) % 1 : (Number(values[0]) || 0) % (Number(values[1]) || 1);
      default: return undefined;
    }
  };
  const res = evalNode(logic);
  return (typeof res === "undefined") ? fallback : res;
};`
  ]);
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
  const filePath = path.join(dir, `${kebab(page.name)}.tsx`);
  const sf = project.createSourceFile(filePath, "", { overwrite: true });

  sf.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  sf.addImportDeclaration({ moduleSpecifier: "react", namedImports: ["useEffect", "useState"] });

  // import referenced components
  for (const c of page.components) {
    sf.addImportDeclaration({ moduleSpecifier: `../components/${kebab(c.name)}`, namedImports: [pascal(c.name)] });
  }

  const compName = `${pascal(page.name)}Page`;
  const fn = sf.addFunction({ name: compName, isExported: true });
  fn.setBodyText((writer) => {
    writer.writeLine("return (");
    writer.writeLine("  <div className=\"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500\">");

    if (!page.hideHeader) {
      writer.writeLine("    <header className=\"border-b border-slate-200 dark:border-slate-800 pb-10\">");
      writer.writeLine(`      <div className=\"flex items-center gap-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4\">`);
      writer.writeLine(`         <div className=\"w-10 h-[1px] bg-slate-200 dark:bg-slate-800\"></div>`);
      writer.writeLine(`         <span>Resource: ${page.name}</span>`);
      writer.writeLine(`      </div>`);
      writer.writeLine(`      <h1 className=\"text-5xl md:text-6xl font-black text-slate-950 dark:text-white tracking-tighter\">${page.name}</h1>`);

      const description = page.description || `Manage your ${page.name.toLowerCase()} assets and application state in this unified view.`;
      writer.writeLine(`      <p className=\"mt-4 text-slate-500 dark:text-slate-400 text-lg max-w-3xl leading-relaxed font-medium\">${description}</p>`);
      writer.writeLine("    </header>");
    }

    writer.writeLine("    <div className=\"grid gap-12\">");
    for (const c of page.components) {
      writer.writeLine(`      <section className=\"relative shrink-0\">`);
      writer.writeLine(`        <${pascal(c.name)} />`);
      writer.writeLine(`      </section>`);
    }
    writer.writeLine("    </div>");
    writer.writeLine("  </div>");
    writer.writeLine(");");
  });
}

function emitComponent(project: Project, frontendDir: string, component: FrontendComponent, ir: FrontendTargetIR) {
  const dir = path.join(frontendDir, "components");
  project.createDirectory(dir);
  const filePath = path.join(dir, `${kebab(component.name)}.tsx`);
  const sf = project.createSourceFile(filePath, "", { overwrite: true });

  const hasIpcButton = Boolean((component as any).props && (component as any).props["ipcChannel"]);
  const needsHooks = !!component.themeToggle || !!(component.form && component.form.fields && component.form.fields.length > 0) || (component.layout?.kind === "tabs") || hasIpcButton;
  if (needsHooks) {
    sf.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React", namedImports: ["useEffect", "useState"] });
  } else {
    sf.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  }
  sf.addImportDeclaration({ moduleSpecifier: "lucide-react", namespaceImport: "Icons" });
  sf.addImportDeclaration({ moduleSpecifier: "../lib/logic", namedImports: ["evalLogic", "getByPath", "isEmptyVal"] });

  if (component.codeBlock) {
    sf.addImportDeclaration({
      moduleSpecifier: "react-syntax-highlighter",
      namedImports: ["Prism as SyntaxHighlighter"],
    });
    sf.addImportDeclaration({
      moduleSpecifier: "react-syntax-highlighter/dist/esm/styles/prism",
      namedImports: ["oneDark"],
    });
  }

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
      const safeChildName = pascal(childName);
      sf.addImportDeclaration({
        moduleSpecifier: `./${kebab(childName)}`,
        namedImports: [safeChildName],
      });
    }
  }

  const compName = `${pascal(component.name)}`;
  const fn = sf.addFunction({ name: compName, isExported: true });

  fn.setBodyText((writer) => {
    // Utility classes
    // Utility classes - Modern & Premium
    const primaryColor = ir.policies.frontend.styling.theme.primaryColor || "#000000";
    const labelClass = "block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1.5";
    const inputClass = `mt-1 block w-full rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm transition-all duration-200 focus:border-slate-900 dark:focus:border-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 sm:text-sm dark:text-slate-100`;
    const checkboxClass = "h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-slate-900 bg-white dark:bg-slate-900";
    const radioClass = "h-4 w-4 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-slate-900 bg-white dark:bg-slate-900";
    const btnClass = `inline-flex items-center justify-center rounded-lg border border-transparent py-2.5 px-5 text-sm font-semibold text-white shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2`;
    const errorClass = "mt-2 text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1";
    const formClass = "space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none px-6 py-8 sm:rounded-2xl";

    // Theme Toggle component
    if (component.themeToggle) {
      writer.writeLine(`const [isDark, setIsDark] = useState(() => {`);
      writer.writeLine(`  if (typeof window !== 'undefined') {`);
      writer.writeLine(`    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';`);
      writer.writeLine(`  }`);
      writer.writeLine(`  return false;`);
      writer.writeLine(`});`);
      writer.writeLine("");
      writer.writeLine(`useEffect(() => {`);
      writer.writeLine(`  if (isDark) {`);
      writer.writeLine(`    document.documentElement.classList.add('dark');`);
      writer.writeLine(`    localStorage.setItem('theme', 'dark');`);
      writer.writeLine(`  } else {`);
      writer.writeLine(`    document.documentElement.classList.remove('dark');`);
      writer.writeLine(`    localStorage.setItem('theme', 'light');`);
      writer.writeLine(`  }`);
      writer.writeLine(`}, [isDark]);`);
      writer.writeLine("");
      writer.writeLine(`return (`);
      writer.writeLine(`  <button `);
      writer.writeLine(`    onClick={() => setIsDark(!isDark)} `);
      writer.writeLine(`    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-95 group" `);
      writer.writeLine(`    aria-label="Toggle dark mode"`);
      writer.writeLine(`  >`);
      writer.writeLine(`    <div className="relative w-5 h-5">`);
      writer.writeLine(`      <Icons.Sun className="absolute inset-0 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all text-amber-500" size={20} />`);
      writer.writeLine(`      <Icons.Moon className="absolute inset-0 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all text-indigo-400" size={20} />`);
      writer.writeLine(`    </div>`);
      writer.writeLine(`  </button>`);
      writer.writeLine(`);`);
      return;
    }

    // Syntax Highlighter
    if (component.codeBlock) {
      const { snippet, language, showLineNumbers } = component.codeBlock;
      writer.writeLine(`return (`);
      writer.writeLine(`  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">`);
      writer.writeLine(`    <SyntaxHighlighter `);
      writer.writeLine(`      language="${language}" `);
      writer.writeLine(`      style={oneDark} `);
      writer.writeLine(`      showLineNumbers={${showLineNumbers}}`);
      writer.writeLine(`      customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.875rem' }}`);
      writer.writeLine(`    >`);
      writer.writeLine(`      {\`${snippet.replace(/`/g, "\\`").replace(/\${/g, "\\${")}\`}`);
      writer.writeLine(`    </SyntaxHighlighter>`);
      writer.writeLine(`  </div>`);
      writer.writeLine(`);`);
      return;
    }

    // Marketing components
    if (component.marketing) {
      writer.writeLine(`return (`);
      writer.writeLine(`  <>`);
      emitMarketingComponent(writer, component.marketing, ir.policies.frontend);
      writer.writeLine(`  </>`);
      writer.writeLine(`);`);
      return;
    }

    // Layout components (real child components)
    if (hasIpcButton) {
      const channel = (component as any).props["ipcChannel"];
      const title = (component as any).props["title"] ?? "IPC Demo";
      const description = (component as any).props["description"] ?? "Invoke IPC channel from renderer";
      writer.writeLine(`const [result, setResult] = useState<string | null>(null);`);
      writer.writeLine(`const [error, setError] = useState<string | null>(null);`);
      writer.writeLine(`const handleClick = async () => {`);
      writer.writeLine(`  try {`);
      writer.writeLine(`    // @ts-ignore - bridge injected by Electron preload`);
      writer.writeLine(`    const api = (window as any).api;`);
      writer.writeLine(`    if (!api?.invoke) { setError("IPC bridge unavailable"); return; }`);
      writer.writeLine(`    const res = await api.invoke("${channel}");`);
      writer.writeLine(`    setResult(res ?? "No selection");`);
      writer.writeLine(`    setError(null);`);
      writer.writeLine(`  } catch (err:any) {`);
      writer.writeLine(`    setError(err?.message ?? String(err));`);
      writer.writeLine(`  }`);
      writer.writeLine(`};`);
      writer.writeLine(`return (`);
      writer.writeLine(`  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">`);
      writer.writeLine(`    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">`);
      writer.writeLine(`      <div>`);
      writer.writeLine(`        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">`);
      writer.writeLine(`          <Icons.Activity size={20} className="text-slate-400 dark:text-slate-500" />`);
      writer.writeLine(`          {${JSON.stringify(title)}}`);
      writer.writeLine(`        </h3>`);
      writer.writeLine(`        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{${JSON.stringify(description)}}</p>`);
      writer.writeLine(`      </div>`);
      writer.writeLine(`      <div className="px-2 py-1 rounded bg-slate-900/5 dark:bg-white/5 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-950/5 dark:border-white/5">Bridge: ${channel}</div>`);
      writer.writeLine(`    </div>`);
      writer.writeLine(`    <button onClick={handleClick} className="${btnClass} w-full sm:w-auto" style={{ backgroundColor: "${primaryColor}" }}>`);
      writer.writeLine(`      <Icons.Cpu size={16} className="mr-2" />`);
      writer.writeLine(`      Invoke IPC Hook`);
      writer.writeLine(`    </button>`);
      writer.writeLine(`    {(result || error) && (`);
      writer.writeLine(`      <div className={\`rounded-xl p-4 font-mono text-xs border \${error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-900 text-slate-300 border-white/10 shadow-inner'}\`}>`);
      writer.writeLine(`        <div className="flex items-center gap-2 mb-2 opacity-50">`);
      writer.writeLine(`          <div className={\`w-2 h-2 rounded-full \${error ? 'bg-red-500' : 'bg-green-500 animate-pulse'}\`}></div>`);
      writer.writeLine(`          <span>\${error ? 'EXECUTION ERROR' : 'TERMINAL OUTPUT'}</span>`);
      writer.writeLine(`        </div>`);
      writer.writeLine(`        {error ? error : String(result)}`);
      writer.writeLine(`      </div>`);
      writer.writeLine(`    )}`);
      writer.writeLine(`  </div>`);
      writer.writeLine(`);`);
      return;
    }
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
        writer.writeLine(`  <div className=\"bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm\">`);
        if (component.layout.title) writer.writeLine(`    <div className=\"px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50\"><h3 className=\"text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider\">${component.layout.title}</h3></div>`);
        writer.writeLine(`    <div className=\"p-2 flex gap-1 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800\">`);
        writer.writeLine(`      {tabs.map((t:any, idx:number) => (`);
        writer.writeLine(`        <button key={idx} onClick={() => setActive(idx)} className={\`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all \${active === idx ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}\`}>{t.label}</button>`);
        writer.writeLine(`      ))}`);
        writer.writeLine(`    </div>`);
        writer.writeLine(`    <div className=\"p-6\">`);
        writer.writeLine(`      {tabs[active] ? (`);
        writer.writeLine(`        <div className=\"space-y-4\">`);
        writer.writeLine(`          {tabs[active].content && <p className=\"text-slate-600 dark:text-slate-400 leading-relaxed\">{tabs[active].content}</p>}`);
        writer.writeLine(`          {tabs[active].items && tabs[active].items.length > 0 ? (`);
        writer.writeLine(`             <div className=\"grid gap-4\">`);
        writer.writeLine(`               {tabs[active].items.map((Comp: any, idx: number) => <div key={idx}><Comp /></div>)}`);
        writer.writeLine(`             </div>`);
        writer.writeLine(`          ) : (!tabs[active].content && <div className=\"text-center py-8 text-slate-400 dark:text-slate-500 text-sm italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl\">Empty tab</div>)}`);
        writer.writeLine(`        </div>`);
        writer.writeLine(`      ) : <p className=\"text-slate-400 dark:text-slate-500 text-sm\">No content.</p>}`);
        writer.writeLine(`    </div>`);
        writer.writeLine(`  </div>`);
        writer.writeLine(`);`);
        return;
      } else if (kind === "panel") {
        writer.writeLine(`return (`);
        writer.writeLine(`  <div className=\"bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden px-1 py-1\">`);
        if (component.layout.title) writer.writeLine(`    <h3 className=\"px-5 py-4 text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30\">${component.layout.title}</h3>`);
        writer.writeLine(`    <div className=\"p-5 space-y-4\">`);
        if (component.layout.items?.length) {
          for (const item of component.layout.items ?? []) {
            if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(item)) {
              writer.writeLine(`      <${item} />`);
            } else {
              writer.writeLine(`      <div className=\"p-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-300 dark:text-slate-700 text-xs font-medium uppercase tracking-tighter italic\">Placeholder: ${item}</div>`);
            }
          }
        } else {
          writer.writeLine(`      <p className=\"text-slate-400 dark:text-slate-500 text-sm italic text-center py-10\">Empty panel</p>`);
        }
        writer.writeLine(`    </div>`);
        writer.writeLine(`  </div>`);
        writer.writeLine(`);`);
        return;
      } else if (kind === "row" || kind === "column") {
        const cols = component.layout.columns ?? 2;
        const grid = kind === "row" ? `grid-cols-${Math.min(4, Math.max(1, cols))}` : "grid-cols-1";
        const validItems = (component.layout.items ?? []).filter((n) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(n));
        writer.writeLine(`const items = [${validItems.join(", ")}];`);
        writer.writeLine(`return (`);
        writer.writeLine(`  <div className=\"space-y-6\">`);
        if (component.layout.title) writer.writeLine(`    <h3 className=\"text-2xl font-black text-slate-900 dark:text-white tracking-tight\">${component.layout.title}</h3>`);
        writer.writeLine("    <div className={`grid gap-6 " + grid + "`}>");
        writer.writeLine(`      {items.length ? items.map((Comp: any, idx: number) => (`);
        writer.writeLine(`        <div key={idx} className=\"transition-all duration-300 hover:-translate-y-1\"><Comp /></div>`);
        writer.writeLine(`      )) : <div className=\"col-span-full py-20 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center text-slate-400 dark:text-slate-500 italic\">No items</div>}`);
        writer.writeLine(`    </div>`);
        writer.writeLine(`  </div>`);
        writer.writeLine(`);`);
        return;
      }
    }

    // Non-form content/button components
    if (component.content || component.html || component.button) {
      writer.writeLine(`return (`);
      writer.writeLine(`  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl space-y-4">`);
      if (component.content) writer.writeLine(`    <p className="text-slate-700 dark:text-slate-400 leading-relaxed">${component.content}</p>`);
      if (component.html) writer.writeLine(`    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(component.html)} }} />`);
      if (component.button) {
        const variant = component.button.label ? (component.button.variant ?? "primary") : "primary";
        const baseBtn = "inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-slate-900/5";
        const variantClass = variant === "secondary"
          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700"
          : (variant === "ghost"
            ? "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            : "text-white hover:opacity-90");

        const style = variant === "primary" ? { backgroundColor: ir.policies.frontend.styling.theme.primaryColor } : {};
        writer.writeLine(`    <button className="${baseBtn} ${variantClass}" style={${JSON.stringify(style)}} onClick={() => { /* TODO: wire action */ }}>`);
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
      writer.writeLine(`const getFieldVal = (field: string) => getByPath(ctx, field.replace(/[^a-zA-Z0-9_]/g, "_"));`);

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

        if (f.loweredDefaultValue) {
          const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
          const deps = f.loweredDefaultValue.dependencies.map(d => d.replace(/[^a-zA-Z0-9_]/g, "_"));
          writer.writeLine(`useEffect(() => { const v = evalLogic(${JSON.stringify(f.loweredDefaultValue.logic)}, ${varName}, ctx); if (typeof v !== "undefined" && ${varName} === "" ) set_${varName}(v); }, [${deps.join(", ")}]);`);
        }

        if (f.loweredComputeValue) {
          const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
          const deps = f.loweredComputeValue.dependencies.map(d => d.replace(/[^a-zA-Z0-9_]/g, "_"));
          writer.writeLine(`useEffect(() => { const next = evalLogic(${JSON.stringify(f.loweredComputeValue.logic)}, ${varName}, ctx); if (typeof next !== "undefined" && next !== ${varName}) set_${varName}(next); }, [${deps.join(", ")}]);`);
        }
      }

      // 3. VALIDATION
      writer.writeLine(`const validate = () => {`);
      writer.writeLine(`  const n: Record<string,string> = {};`);

      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        const rules = f.loweredValidators ?? [];
        if (rules.length === 0) continue;

        writer.writeLine(`  // ${f.name} validation`);
        for (const rule of rules) {
          const msg = JSON.stringify(rule.message);
          writer.writeLine(`  if (!n["${f.name}"]) {`);
          switch (rule.type) {
            case "required":
              writer.writeLine(`    if (isEmptyVal(${varName})) n["${f.name}"] = ${msg};`);
              break;
            case "requiredIf":
              writer.writeLine(`    if (evalLogic(${JSON.stringify(rule.logic)}, false) && isEmptyVal(${varName})) n["${f.name}"] = ${msg};`);
              break;
            case "min":
              if (rule.params?.isDate) {
                writer.writeLine(`    const d = Date.parse(${varName}); const min = Date.parse("${rule.params.value}");`);
                writer.writeLine(`    if (!isNaN(d) && !isNaN(min) && d < min) n["${f.name}"] = ${msg};`);
              } else {
                writer.writeLine(`    if (Number(${varName}) < ${rule.params?.value}) n["${f.name}"] = ${msg};`);
              }
              break;
            case "max":
              if (rule.params?.isDate) {
                writer.writeLine(`    const d = Date.parse(${varName}); const max = Date.parse("${rule.params.value}");`);
                writer.writeLine(`    if (!isNaN(d) && !isNaN(max) && d > max) n["${f.name}"] = ${msg};`);
              } else {
                writer.writeLine(`    if (Number(${varName}) > ${rule.params?.value}) n["${f.name}"] = ${msg};`);
              }
              break;
            case "minLength":
              writer.writeLine(`    if (${varName}.toString().length < ${rule.params?.value}) n["${f.name}"] = ${msg};`);
              break;
            case "maxLength":
              writer.writeLine(`    if (${varName}.toString().length > ${rule.params?.value}) n["${f.name}"] = ${msg};`);
              break;
            case "pattern":
              writer.writeLine(`    try { const re = new RegExp(${JSON.stringify(rule.params?.value)}); if (!re.test(${varName}.toString())) n["${f.name}"] = ${msg}; } catch (_) {}`);
              break;
            case "format":
              if (rule.params?.value === "email") {
                writer.writeLine(`    if (${varName} && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${varName}.toString())) n["${f.name}"] = ${msg};`);
              } else if (rule.params?.value === "url") {
                writer.writeLine(`    if (${varName}) { try { new URL(${varName}.toString()); } catch (_) { n["${f.name}"] = ${msg}; } }`);
              }
              break;
            case "equalsField":
              writer.writeLine(`    if (${varName} != getFieldVal("${rule.params?.value}")) n["${f.name}"] = ${msg};`);
              break;
            case "notEqualsField":
              writer.writeLine(`    if (${varName} == getFieldVal("${rule.params?.value}")) n["${f.name}"] = ${msg};`);
              break;
            case "greaterThanField":
              writer.writeLine(`    { const other = getFieldVal("${rule.params?.value}"); const lhs = Number(${varName}); const rhs = Number(other); if (!isNaN(lhs) && !isNaN(rhs) && lhs <= rhs) n["${f.name}"] = ${msg}; }`);
              break;
            case "lessThanField":
              writer.writeLine(`    { const other = getFieldVal("${rule.params?.value}"); const lhs = Number(${varName}); const rhs = Number(other); if (!isNaN(lhs) && !isNaN(rhs) && lhs >= rhs) n["${f.name}"] = ${msg}; }`);
              break;
            case "custom":
              writer.writeLine(`    if (!evalLogic(${JSON.stringify(rule.logic)}, false)) n["${f.name}"] = ${msg};`);
              break;
            case "uniqueIn":
              writer.writeLine(`    if (${JSON.stringify(rule.params?.value)}.includes(${varName})) n["${f.name}"] = ${msg};`);
              break;
          }
          writer.writeLine(`  }`);
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

        const visibleExpr = f.loweredVisibleIf ? JSON.stringify(f.loweredVisibleIf.logic) : undefined;
        writer.writeLine(`    {(() => {`);
        if (visibleExpr) {
          writer.writeLine(`      const visible = evalLogic(${visibleExpr}, true, ctx);`);
          writer.writeLine(`      if (!visible) return null;`);
        }
        const disabledExpr = f.loweredDisabledIf ? JSON.stringify(f.loweredDisabledIf.logic) : undefined;
        writer.writeLine(`      const disabledVal = ${disabledExpr ? `evalLogic(${disabledExpr}, false, ctx)` : "false"};`);

        writer.writeLine(`      return (`);
        writer.writeLine(`    <div className="${f.className ?? ""}">`);
        writer.writeLine(`      <div className="flex items-center gap-2">`);
        writer.writeLine(`        <label className=\"${labelClass}\">${label}</label>`);
        if (f.tooltip) {
          writer.writeLine(`        <span className="text-gray-400 dark:text-gray-500" title="${f.tooltip}">ℹ️</span>`);
        }
        writer.writeLine(`      </div>`);

        // Icon wrapper
        if (f.icon) {
          writer.writeLine(`      <div className="relative mt-1 rounded-md shadow-sm">`);
          writer.writeLine(`        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">`);
          writer.writeLine(`          {(Icons as any)["${f.icon}"] && React.createElement((Icons as any)["${f.icon}"], { size: 16, className: "text-gray-400 dark:text-gray-500" })}`);
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
            writer.writeLine(`          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>`);
            writer.writeLine(`          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-2/3"></div>`);
            writer.writeLine(`        </div>}`);
            writer.writeLine(`        {error_${varName} && <p className="text-xs font-semibold text-red-500 mb-2">{error_${varName}}</p>}`);
            writer.writeLine(`        <div className="relative mb-3">`);
            writer.writeLine(`          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />`);
            writer.writeLine(`          <input className="${inputClass} pl-9" placeholder="${f.searchPlaceholder ?? "Type to filter..."}" value={search_${varName}} onChange={e => { setSearch_${varName}(e.target.value); setPage_${varName}(1); }} aria-label="${f.ariaLabel ?? label} search" />`);
            writer.writeLine(`        </div>`);
            writer.writeLine(`        {(() => { const filtered = options_${varName}; return (`);
            writer.writeLine(`          <div className="relative">`);
            writer.writeLine(`            <select className=\"appearance-none ${inputClassName}\" name=\"${f.name}\" ${f.multiple ? "multiple" : ""} value={${f.multiple ? varName : `${varName} || ""`}} onChange={(e) => {`);
            writer.writeLine(`              set_${varName}(${f.multiple ? "Array.from(e.target.selectedOptions).map(o => o.value)" : "e.target.value"});`);
            writer.writeLine(`            }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" aria-busy={loading_${varName}} aria-invalid={Boolean(errors["${f.name}"])}>`);
            if (!f.multiple) writer.writeLine(`            <option value="">Select an option...</option>`);
            writer.writeLine(`            {filtered.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}`);
            writer.writeLine(`            </select>`);
            if (!f.multiple) {
              writer.writeLine(`            <Icons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />`);
            }
            writer.writeLine(`          </div>`);
            writer.writeLine(`        ); })()}`);
            writer.writeLine(`        <div className="flex items-center justify-between mt-3 px-1">`);
            writer.writeLine(`          <div className="flex gap-2">`);
            writer.writeLine(`            <button type="button" className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setPage_${varName}(p => Math.max(1, p - 1))} disabled={page_${varName} <= 1}><Icons.ChevronLeft size={16}/></button>`);
            writer.writeLine(`            <button type="button" className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setPage_${varName}(p => hasMore_${varName} ? p + 1 : p)} disabled={!hasMore_${varName}}><Icons.ChevronRight size={16}/></button>`);
            writer.writeLine(`          </div>`);
            writer.writeLine(`          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Page {page_${varName}}</span>`);
            if (f.clearable) {
              writer.writeLine(`          <button type="button" className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => set_${varName}(${f.multiple ? "[]" : '""'})}>Reset</button>`);
            }
            writer.writeLine(`        </div>`);
          } else {
            writer.writeLine(`        <div className="relative">`);
            writer.writeLine(`          <select className=\"appearance-none ${inputClassName}\" name=\"${f.name}\" ${f.multiple ? "multiple" : ""} value={${f.multiple ? varName : `${varName} || ""`}} onChange={(e) => {`);
            if (f.multiple) {
              writer.writeLine(`            const vals = Array.from(e.target.selectedOptions).map(o => o.value); set_${varName}(vals);`);
            } else {
              writer.writeLine(`            set_${varName}(e.target.value);`);
            }
            writer.writeLine(`          }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" aria-invalid={Boolean(errors["${f.name}"])}>`);
            if (!f.multiple) writer.writeLine(`            <option value="">Select...</option>`);
            if (f.options) {
              for (const opt of f.options) {
                writer.writeLine(`            <option value="${opt.value}">${opt.label}</option>`);
              }
            }
            writer.writeLine(`          </select>`);
            if (!f.multiple) {
              writer.writeLine(`          <Icons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />`);
            }
            writer.writeLine(`        </div>`);
            if (f.clearable) {
              writer.writeLine(`        <button type="button" className="mt-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest" onClick={() => set_${varName}(${f.multiple ? "[]" : '""'})}>Reset selection</button>`);
            }
          }
        } else if (f.type === "tags") {
          writer.writeLine(`        <div className="flex flex-wrap gap-2 mb-2">`);
          writer.writeLine(`          {${varName}.map((tag: string, idx: number) => (`);
          writer.writeLine(`            <span key={idx} className="inline-flex items-center gap-1.5 bg-slate-900 text-white pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold shadow-sm animate-in zoom-in-50">`);
          writer.writeLine(`              {tag}`);
          writer.writeLine(`              <button type="button" onClick={() => set_${varName}(${varName}.filter((_: any,i: number)=>i!==idx))} className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors" aria-label="Remove tag">`);
          writer.writeLine(`                <Icons.X size={10} />`);
          writer.writeLine(`              </button>`);
          writer.writeLine(`            </span>`);
          writer.writeLine(`          ))}`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        <div className="relative">`);
          writer.writeLine(`          <Icons.Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />`);
          writer.writeLine(`          <input className="${inputClassName} pl-9" placeholder="${f.placeholder ?? "New tag..."}" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const val = (e.target as HTMLInputElement).value.trim(); if (val) { set_${varName}([...${varName}, val]); (e.target as HTMLInputElement).value = ""; } } }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        <div className="relative group/file">`);
          writer.writeLine(`          <input className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" name="${f.name}" type="file" ${f.accept ? `accept="${f.accept}"` : ""} ${f.multiple ? "multiple" : ""} onChange={(e) => { const files = e.target.files; if (!files) return; ${f.multiple ? `set_${varName}(Array.from(files));` : `set_${varName}(files[0] ?? null);`} }} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`          <div className="\${inputClassName} flex items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 group-hover/file:border-slate-400 dark:group-hover/file:border-slate-600 transition-colors text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">`);
          writer.writeLine(`            <div className="text-center">`);
          writer.writeLine(`              <Icons.UploadCloud size={24} className="mx-auto mb-2 opacity-50" />`);
          writer.writeLine(`              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Click or drag to upload</p>`);
          writer.writeLine(`              <p className="text-[10px] mt-1 italic text-slate-400">${f.multiple ? 'Multiple files supported' : (f.accept ? `Accepted: ${f.accept}` : 'All file types')}</p>`);
          writer.writeLine(`            </div>`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        {${varName} && (`);
          writer.writeLine(`          <div className="mt-3 space-y-2">`);
          if (f.multiple) {
            writer.writeLine(`            {(${varName} as File[]).map((file, i) => (`);
            writer.writeLine(`              <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400">`);
            writer.writeLine(`                <Icons.File size={14} className="text-slate-400 dark:text-slate-500" />`);
            writer.writeLine(`                <span className="truncate flex-1">{file.name}</span>`);
            writer.writeLine(`                <span className="text-[10px] text-slate-300 dark:text-slate-600">{(file.size / 1024).toFixed(1)}KB</span>`);
            writer.writeLine(`              </div>`);
            writer.writeLine(`            ))}`);
          } else {
            writer.writeLine(`            <div className="flex items-center gap-2 p-2 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200">`);
            writer.writeLine(`              <Icons.FileCheck size={14} className="text-emerald-500 dark:text-emerald-400" />`);
            writer.writeLine(`              <span className="truncate flex-1">{(${varName} as File).name}</span>`);
            writer.writeLine(`              <button type="button" onClick={() => set_${varName}(null)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"><Icons.X size={14}/></button>`);
            writer.writeLine(`            </div>`);
          }
          writer.writeLine(`          </div>`);
          writer.writeLine(`        )}`);
          const minVal = (f.validators && typeof f.validators.min !== "undefined") ? f.validators.min : 0;
          const maxVal = (f.validators && typeof f.validators.max !== "undefined") ? f.validators.max : 100;
          const stepVal = f.step ?? 1;
          writer.writeLine(`        <div className="py-4 px-1">`);
          writer.writeLine(`          <input className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white" type="range" min="${minVal}" max="${maxVal}" step="${stepVal}" value={${varName} || ${minVal}} onChange={(e) => set_${varName}(e.target.value)} disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`          <div className="flex justify-between mt-3">`);
          writer.writeLine(`            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase underline decoration-slate-200 dark:decoration-slate-800 decoration-2 underline-offset-4">${minVal}</span>`);
          writer.writeLine(`            <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-slate-900/20 dark:shadow-white/10">{${varName} || ${minVal}}</span>`);
          writer.writeLine(`            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase underline decoration-slate-200 dark:decoration-slate-800 decoration-2 underline-offset-4">${maxVal}</span>`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        <div className="relative group/currency">`);
          writer.writeLine(`          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none group-focus-within/currency:text-slate-900 dark:group-focus-within/currency:text-white transition-colors">${f.defaultCurrency ?? "Rp"}</div>`);
          writer.writeLine(`          <input className="${inputClassName} pl-10 font-bold text-slate-900 dark:text-white" name="${f.name}" type="number" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} placeholder="${f.placeholder ?? '0.00'}" disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        <div className="flex gap-3">`);
          writer.writeLine(`          <div className="relative flex-1">`);
          writer.writeLine(`            <Icons.Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />`);
          writer.writeLine(`            <input className="${inputClassName} pl-9" type="date" value={${varName}.start} onChange={(e)=> set_${varName}({...${varName}, start: e.target.value})} disabled={disabledVal} aria-label="${f.ariaLabel ?? label} start" />`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`          <div className="flex items-center text-slate-300 dark:text-slate-600 font-bold">→</div>`);
          writer.writeLine(`          <div className="relative flex-1">`);
          writer.writeLine(`            <Icons.Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />`);
          writer.writeLine(`            <input className="${inputClassName} pl-9" type="date" value={${varName}.end} onChange={(e)=> set_${varName}({...${varName}, end: e.target.value})} disabled={disabledVal} aria-label="${f.ariaLabel ?? label} end" />`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`        </div>`);
          writer.writeLine(`        <div className="relative group/sig">`);
          writer.writeLine(`          <div className="absolute top-3 right-3 opacity-20 group-hover/sig:opacity-40 transition-opacity">`);
          writer.writeLine(`            <Icons.PenTool size={32} className="text-slate-300 dark:text-slate-600" />`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`          <textarea className="${inputClassName} min-h-[120px] font-mono text-xs border-2 border-slate-100 dark:border-slate-800 italic" name="${f.name}" value={${varName}} onChange={(e)=> set_${varName}(e.target.value)} placeholder="${f.placeholder ?? 'Signature trace or base64...'}" disabled={disabledVal} aria-label="${f.ariaLabel ?? label}" />`);
          writer.writeLine(`          <div className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-tighter">`);
          writer.writeLine(`            <Icons.ShieldCheck size={12} className="text-emerald-500 dark:text-emerald-400" /> Secure digital verification trace`);
          writer.writeLine(`          </div>`);
          writer.writeLine(`        </div>`);
        } else {
          const inputType = (["number", "email", "password", "date", "datetime", "time", "url", "phone"].includes(f.type)) ? (f.type === "phone" ? "tel" : f.type) : "text";
          if (f.type === "textarea") {
            writer.writeLine(`        <textarea className=\"${inputClassName} min-h-[140px] resize-none\" name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} placeholder=\"${f.placeholder ?? ''}\" disabled={disabledVal} />`);
          } else if (f.type === "checkbox") {
            writer.writeLine(`        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all hover:bg-slate-100/50">`);
            writer.writeLine(`          <input className=\"${checkboxClass} w-5 h-5 cursor-pointer\" name=\"${f.name}\" checked={${varName}} onChange={(e) => set_${varName}(e.target.checked)} type="checkbox" disabled={disabledVal} />`);
            writer.writeLine(`          <div className="flex-1">`);
            writer.writeLine(`            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">Confirm Selection</p>`);
            writer.writeLine(`            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Check to acknowledge that the data above is correct.</p>`);
            writer.writeLine(`          </div>`);
            writer.writeLine(`        </div>`);
          } else if (f.type === "radio") {
            if (f.options) {
              writer.writeLine(`        <div className="grid gap-3">`);
              for (const opt of (f.options ?? [])) {
                writer.writeLine(`          <label className={\`relative flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all \${${varName} === "${opt.value}" ? 'border-slate-950 dark:border-white bg-slate-50 dark:bg-slate-900 shadow-inner' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}\`}>`);
                writer.writeLine(`            <input className="sr-only" type="radio" name="${f.name}" value="${opt.value}" checked={${varName} === "${opt.value}"} onChange={(e) => set_${varName}(e.target.value)} disabled={disabledVal} />`);
                writer.writeLine(`            <div className="flex-1">`);
                writer.writeLine(`              <p className={\`text-sm font-bold \${${varName} === "${opt.value}" ? 'text-slate-950 dark:text-white' : 'text-slate-600 dark:text-slate-400'}\`}>${opt.label}</p>`);
                writer.writeLine(`              <p className="text-[10px] text-slate-400 dark:text-slate-500">Option preference identifier: ${opt.value}</p>`);
                writer.writeLine(`            </div>`);
                writer.writeLine(`            <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${${varName} === "${opt.value}" ? 'border-slate-950 dark:border-white bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-700'}\`}>`);
                writer.writeLine(`              {${varName} === "${opt.value}" && <div className="w-2.5 h-2.5 rounded-full bg-slate-950 dark:bg-white animate-in zoom-in-50" />}`);
                writer.writeLine(`            </div>`);
                writer.writeLine(`          </label>`);
              }
              writer.writeLine(`        </div>`);
            } else {
              writer.writeLine(`        <input className=\"${inputClassName}\" name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} type="text" placeholder=\"${f.placeholder ?? ''}\" disabled={disabledVal} />`);
            }
          } else {
            writer.writeLine(`        <input className=\"${inputClassName} h-11\" name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} type=\"${inputType}\" placeholder=\"${f.placeholder ?? ''}\" disabled={disabledVal} />`);
          }
        }

        if (f.suffix) {
          writer.writeLine(`        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 text-sm pointer-events-none">${f.suffix}</span>`);
        }

        writer.writeLine(`      </div>`); // End relative wrapper/mt-1

        if (f.description) {
          writer.writeLine(`      <p className="mt-2.5 text-xs font-medium text-slate-400 dark:text-slate-500 leading-relaxed">${f.description}</p>`);
        }
        writer.writeLine(`      {errors["${f.name}"] && <div className=\"${errorClass}\"><Icons.AlertCircle size={12}/> {errors["${f.name}"]}</div>}`);
        if (f.helpHtml) {
          writer.writeLine(`      <div className="mt-3 p-3 bg-slate-900/5 dark:bg-white/5 rounded-lg border border-slate-950/5 dark:border-white/5 text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-normal italic" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(f.helpHtml)} }} />`);
        }
        writer.writeLine(`    </div>`);
        writer.writeLine(`      );`);
        writer.writeLine(`    })()}`);
        writer.writeLine("");
      }

      writer.writeLine(`    {submitSuccess && <div className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">{submitSuccess}</div>}`);
      writer.writeLine(`    {submitError && <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">{submitError}</div>}`);
      writer.writeLine(`    <button className="${btnClass} w-full shadow-lg" style={{ backgroundColor: "${primaryColor}" }} type="submit" disabled={submitting}>`);
      writer.writeLine(`      {submitting ? (`);
      writer.writeLine(`        <span className="flex items-center gap-2">`);
      writer.writeLine(`          <Icons.Loader2 className="animate-spin" size={18} />`);
      writer.writeLine(`          Submitting...`);
      writer.writeLine(`        </span>`);
      writer.writeLine(`      ) : "Submit Application"}`);
      writer.writeLine(`    </button>`);
      writer.writeLine(`  </form>`);
      writer.writeLine(`);`);

    } else {
      writer.writeLine(`return (`);
      writer.writeLine(`  <div className=\"p-6 bg-white shadow rounded-lg\">`);
      if (component.entityRef) {
        writer.writeLine(`    <h3 className=\"text-lg font-medium leading-6 text-gray-900 dark:text-white\">${component.name}</h3>`);
        writer.writeLine(`    <p className=\"mt-1 text-sm text-gray-500 dark:text-gray-400\">Entity: ${component.entityRef}</p>`);
      } else {
        writer.writeLine(`    <h3 className=\"text-lg font-medium leading-6 text-gray-900\">${component.name}</h3>`);
        writer.writeLine(`    <div className=\"mt-4 border-t border-gray-200 pt-4\">`);
        if (component.props) {
          writer.writeLine(`      <dl className=\"grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2\">`);
          for (const [key, type] of Object.entries(component.props)) {
            writer.writeLine(`        <div className=\"sm:col-span-1\">`);
            writer.writeLine(`          <dt className=\"text-sm font-medium text-gray-500 dark:text-gray-400\">${key}</dt>`);
            writer.writeLine(`          <dd className=\"mt-1 text-sm text-gray-900 dark:text-gray-100\">{${JSON.stringify(type)}}</dd>`); // Escape via JSX expression
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

function emitMarketingComponent(writer: any, m: FrontendMarketing, policy: FrontendPolicy) {
  const primaryColor = policy.styling.theme.primaryColor;
  const radiusMap: Record<string, string> = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", full: "rounded-full" };
  const radius = radiusMap[policy.styling.theme.borderRadius] || "rounded-xl";

  if (m.kind === "hero") {
    writer.writeLine(`    <div className="relative overflow-hidden ${radius} bg-slate-950 dark:bg-black text-white p-8 md:p-20">`);
    writer.writeLine(`      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, ${primaryColor}, transparent)' }}></div>`);
    writer.writeLine(`      <div className="relative max-w-4xl space-y-8">`);
    if (m.badge) {
      writer.writeLine(`        <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium border border-white/10 text-slate-300">`);
      writer.writeLine(`          {${JSON.stringify(m.badge)}}`);
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">`);
    writer.writeLine(`          {${JSON.stringify(m.title)}}`);
    writer.writeLine(`        </h1>`);
    writer.writeLine(`        <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">`);
    writer.writeLine(`          {${JSON.stringify(m.subtitle)}}`);
    writer.writeLine(`        </p>`);
    if (m.actions && m.actions.length > 0) {
      writer.writeLine(`        <div className="flex flex-wrap gap-4">`);
      for (const a of m.actions) {
        const btnCls = a.variant === "primary" ? `bg-[${primaryColor}] text-white` : "bg-white/10 text-white border border-white/20 hover:bg-white/20";
        writer.writeLine(`          <a href="${a.href}" className="inline-flex items-center gap-2 px-6 py-3 font-semibold ${radius} transition-all ${btnCls}">`);
        if (a.icon) writer.writeLine(`            {React.createElement((Icons as any)["${a.icon}"], { size: 20 })}`);
        writer.writeLine(`            {${JSON.stringify(a.label)}}`);
        writer.writeLine(`          </a>`);
      }
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  } else if (m.kind === "features") {
    writer.writeLine(`    <div className="py-12 px-2">`);
    if (m.title || m.subtitle) {
      writer.writeLine(`      <div className="text-center mb-12 space-y-2">`);
      if (m.title) writer.writeLine(`        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{${JSON.stringify(m.title)}}</h2>`);
      if (m.subtitle) writer.writeLine(`        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">{${JSON.stringify(m.subtitle)}}</p>`);
      writer.writeLine(`      </div>`);
    }
    writer.writeLine(`      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`        <div className="p-6 border border-slate-100 dark:border-slate-800 ${radius} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">`);
      if (item.icon) {
        writer.writeLine(`          <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 text-[${primaryColor}]">`);
        writer.writeLine(`            {React.createElement((Icons as any)["${item.icon}"], { size: 24 })}`);
        writer.writeLine(`          </div>`);
      }
      writer.writeLine(`          <h3 className="text-lg font-semibold mb-2 dark:text-white">{${JSON.stringify(item.title)}}</h3>`);
      writer.writeLine(`          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{${JSON.stringify(item.description)}}</p>`);
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  } else if (m.kind === "logos") {
    writer.writeLine(`    <div className="py-12 border-y border-slate-100 dark:border-slate-800">`);
    if (m.title) writer.writeLine(`      <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-8">{${JSON.stringify(m.title)}}</p>`);
    writer.writeLine(`      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-10 opacity-50 grayscale hover:grayscale-0 transition-all">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`        <div className="flex items-center gap-2 group text-slate-900 dark:text-white">`);
      if (item.icon) writer.writeLine(`          {React.createElement((Icons as any)["${item.icon}"], { size: 24, className: "opacity-60 group-hover:opacity-100 transition-opacity" })}`);
      writer.writeLine(`          <span className="font-black text-2xl group-hover:text-[${primaryColor}] transition-colors">{${JSON.stringify(item.title)}}</span>`);
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  } else if (m.kind === "testimonials") {
    writer.writeLine(`    <div className="py-12 space-y-8">`);
    if (m.title) writer.writeLine(`      <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{${JSON.stringify(m.title)}}</h2>`);
    writer.writeLine(`      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`        <div className="p-6 ${radius} border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">`);
      writer.writeLine(`          <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">"{${JSON.stringify(item.description)}}"</p>`);
      writer.writeLine(`          <div className="flex items-center gap-3">`);
      if (item.image) writer.writeLine(`            <img src="${item.image}" className="w-10 h-10 rounded-full border border-white/20" alt="" />`);
      writer.writeLine(`            <div>`);
      writer.writeLine(`              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{${JSON.stringify(item.author)}}</p>`);
      writer.writeLine(`              <p className="text-xs text-slate-500 dark:text-slate-400">{${JSON.stringify(item.role)}}</p>`);
      writer.writeLine(`            </div>`);
      writer.writeLine(`          </div>`);
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  } else if (m.kind === "faq") {
    writer.writeLine(`    <div className="max-w-3xl mx-auto py-12">`);
    if (m.title) writer.writeLine(`      <h2 className="text-3xl font-bold text-center mb-10 dark:text-white">{${JSON.stringify(m.title)}}</h2>`);
    writer.writeLine(`      <div className="space-y-4">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`        <details className="border border-slate-100 dark:border-slate-800 ${radius} bg-white dark:bg-slate-900 px-6 py-4 group transition-colors">`);
      writer.writeLine(`          <summary className="flex items-center justify-between font-semibold cursor-pointer list-none dark:text-slate-200">`);
      writer.writeLine(`            {${JSON.stringify(item.title)}}`);
      writer.writeLine(`            <Icons.ChevronDown size={20} className="group-open:rotate-180 transition-transform text-slate-400 dark:text-slate-500" />`);
      writer.writeLine(`          </summary>`);
      writer.writeLine(`          <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{${JSON.stringify(item.description)}}</p>`);
      writer.writeLine(`        </details>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  } else if (m.kind === "cta") {
    writer.writeLine(`    <div className="my-12 p-8 md:p-16 ${radius} bg-slate-900 text-center space-y-6">`);
    writer.writeLine(`      <h2 className="text-3xl md:text-5xl font-black text-white">{${JSON.stringify(m.title)}}</h2>`);
    if (m.subtitle) writer.writeLine(`      <p className="text-lg text-slate-400 max-w-2xl mx-auto">{${JSON.stringify(m.subtitle)}}</p>`);
    if (m.actions && m.actions.length > 0) {
      writer.writeLine(`      <div className="flex justify-center gap-4 pt-4">`);
      for (const a of m.actions) {
        writer.writeLine(`        <a href="${a.href}" className="inline-flex items-center gap-2 px-8 py-3.5 font-bold ${radius} bg-[${primaryColor}] text-white hover:scale-105 active:scale-95 shadow-xl shadow-[${primaryColor}]/20 transition-all">`);
        if (a.icon) writer.writeLine(`          {React.createElement((Icons as any)["${a.icon}"], { size: 20 })}`);
        writer.writeLine(`          {${JSON.stringify(a.label)}}`);
        writer.writeLine(`        </a>`);
      }
      writer.writeLine(`      </div>`);
    }
    writer.writeLine(`    </div>`);
  } else if (m.kind === "stats") {
    writer.writeLine(`    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-16 border-y border-slate-100 dark:border-slate-800">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`      <div className="text-center space-y-1 group">`);
      writer.writeLine(`        <p className="text-5xl font-black text-slate-900 dark:text-white group-hover:text-[${primaryColor}] transition-colors">{${JSON.stringify(item.value)}}</p>`);
      writer.writeLine(`        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{${JSON.stringify(item.label)}}</p>`);
      writer.writeLine(`      </div>`);
    }
    writer.writeLine(`    </div>`);
  } else if (m.kind === "timeline") {
    writer.writeLine(`    <div className="py-12 px-4">`);
    if (m.title) writer.writeLine(`      <h2 className="text-3xl font-bold text-center mb-16 dark:text-white">{${JSON.stringify(m.title)}}</h2>`);
    writer.writeLine(`      <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 md:ml-0 md:border-l-0 md:flex md:justify-between md:gap-4 md:before:absolute md:before:top-6 md:before:left-0 md:before:w-full md:before:h-0.5 md:before:bg-slate-100 dark:md:before:bg-slate-800">`);
    for (const item of (m.items || [])) {
      writer.writeLine(`        <div className="relative pl-8 pb-10 md:pl-0 md:pt-12 md:pb-0 md:flex-1 text-left md:text-center">`);
      writer.writeLine(`          <div className="absolute top-0 left-[-9px] md:left-1/2 md:-translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-[${primaryColor}] z-10 transition-transform hover:scale-125"></div>`);
      writer.writeLine(`          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{${JSON.stringify(item.title)}}</h3>`);
      writer.writeLine(`          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{${JSON.stringify(item.description)}}</p>`);
      writer.writeLine(`        </div>`);
    }
    writer.writeLine(`      </div>`);
    writer.writeLine(`    </div>`);
  }
}
