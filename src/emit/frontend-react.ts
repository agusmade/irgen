import path from "node:path";
import fs from "node:fs";
import { Project, QuoteKind, IndentationText, ScriptTarget } from "ts-morph";
import type { FrontendIR, FrontendPage, FrontendComponent } from "../ir/frontend.js";
import { emitterEngine } from "./engine.js";
import { registerTargetEmitter } from "./registry.js";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export function emitFrontend(project: Project, outDir: string, ir: FrontendIR) {
  const frontendDir = path.join(outDir, "frontend");
  ensureDir(frontendDir);

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

  // App.tsx (Router)
  const appFile = project.createSourceFile(path.join(frontendDir, "App.tsx"), "", { overwrite: true });
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
    <title>${ir.appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/frontend/index.tsx"></script>
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
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
  `.trim(), { overwrite: true });
}

// Register frontend emitter with the engine
try {
  emitterEngine.registerEmitter("frontend-tsmorph", async (ir: FrontendIR, outDir: string) => {
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

  sf.addImportDeclaration({ moduleSpecifier: "lucide-react", namespaceImport: "Icons" });

  const compName = `${component.name}`;
  const fn = sf.addFunction({ name: compName, isExported: true });

  fn.setBodyText((writer) => {
    // Utility classes
    const labelClass = "block text-sm font-medium text-gray-700";
    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
    const btnClass = "inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";
    const errorClass = "mt-2 text-sm text-red-600";
    const formClass = "space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6";

    if (component.form && component.form.fields && component.form.fields.length > 0) {
      // 1. STATE DEFINITIONS
      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        writer.writeLine(`const [${varName}, set_${varName}] = useState("");`);

        // Async Data Source State
        if (f.dataSource) {
          writer.writeLine(`const [options_${varName}, setOptions_${varName}] = useState<{label:string, value:string}[]>([]);`);
        }
      }

      writer.writeLine(`const [errors, set_errors] = useState({} as Record<string,string>);`);

      // 2. EFFECTS (Data Fetching)
      for (const f of component.form.fields) {
        if (f.dataSource) {
          const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
          writer.writeLine(`useEffect(() => {`);
          writer.writeLine(`  fetch("${f.dataSource.url}").then(r => r.json()).then(data => {`);
          writer.writeLine(`    setOptions_${varName}(data.map((item: any) => ({ label: item["${f.dataSource.labelKey}"], value: item["${f.dataSource.valueKey}"] })));`);
          writer.writeLine(`  });`);
          writer.writeLine(`}, []);`);
        }
      }

      // 3. VALIDATION
      writer.writeLine(`const validate = () => {`);
      writer.writeLine(`  const n: Record<string,string> = {};`);

      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        const hasReq = (f.validators && f.validators.required) ? 'true' : 'false';
        writer.writeLine(`  if (${hasReq}) { if (!${varName} || ${varName}.toString().trim() === "") n["${f.name}"] = "${(f.label ?? f.name)} is required"; }`);
        if (f.type === "number") {
          const minVal = (f.validators && typeof f.validators.min !== 'undefined') ? f.validators.min : null;
          if (minVal !== null) {
            writer.writeLine(`  if (!n["${f.name}"] && Number(${varName}) < ${minVal}) n["${f.name}"] = "${(f.label ?? f.name)} must be >= ${minVal}";`);
          }
        }
      }

      writer.writeLine(`  set_errors(n);`);
      writer.writeLine(`  return Object.keys(n).length === 0;`);
      writer.writeLine(`};`);

      writer.writeLine(`const onSubmit = (e: any) => { e.preventDefault(); if (!validate()) return; /* submit stub */ };`);

      // 4. RENDER
      writer.writeLine(`return (`);
      writer.writeLine(`  <form className=\"${formClass}\" onSubmit={onSubmit}>`);

      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        const label = f.label ?? f.name;

        writer.writeLine(`    <div>`);
        writer.writeLine(`      <label className=\"${labelClass}\">${label}</label>`);

        // Icon wrapper
        if (f.icon) {
          writer.writeLine(`      <div className="relative mt-1 rounded-md shadow-sm">`);
          writer.writeLine(`        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">`);
          writer.writeLine(`          {(Icons as any)["${f.icon}"] && React.createElement((Icons as any)["${f.icon}"], { size: 16, className: "text-gray-400" })}`);
          writer.writeLine(`        </div>`);
        } else {
          writer.writeLine(`      <div className="mt-1">`);
        }

        const inputClassName = f.icon ? `${inputClass} pl-10` : inputClass;

        if (f.type === "select") {
          writer.writeLine(`        <select className=\"${inputClassName}\" name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)}>`);
          writer.writeLine(`          <option value="">Select...</option>`);

          if (f.dataSource) {
            // Render from state
            writer.writeLine(`          {options_${varName}.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}`);
          } else if (f.options) {
            // Render static
            for (const opt of f.options) {
              writer.writeLine(`          <option value="${opt.value}">${opt.label}</option>`);
            }
          }
          writer.writeLine(`        </select>`);
        } else {
          const inputType = (f.type === "number") ? "number" : "text"; // date/email/etc support later
          writer.writeLine(`        <input className=\"${inputClassName}\" name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} type=\"${inputType}\" placeholder=\"${f.placeholder ?? ''}\" />`);
        }

        writer.writeLine(`      </div>`); // End relative wrapper/mt-1

        if (f.description) {
          writer.writeLine(`      <p className="mt-2 text-sm text-gray-500">${f.description}</p>`);
        }

        writer.writeLine(`      {errors[\"${f.name}\"] && <div className=\"${errorClass}\">{errors[\"${f.name}\"]}</div>}`);
        writer.writeLine(`    </div>`);
        writer.writeLine("");
      }

      writer.writeLine(`    <button className=\"${btnClass}\" type=\"submit\">Submit</button>`);
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
            writer.writeLine(`          <dd className=\"mt-1 text-sm text-gray-900\">${type}</dd>`); // Placeholder display
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
