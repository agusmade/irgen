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

  // index file
  const idx = project.createSourceFile(path.join(frontendDir, "index.tsx"), "", { overwrite: true });
  // import local styles
  idx.addStatements([`import "./index.css";`, ``, `// Generated frontend entrypoints (React components/pages).`, `export * from "./pages";`, `export * from "./components";`]);

  // generate a lightweight CSS file for basic styling
  const cssPath = path.join(frontendDir, "index.css");
  project.createSourceFile(cssPath, `/* Generated styles for frontend */\n.form { max-width: 600px; margin: 0 auto; }\nlabel { font-weight: 600; }\ninput { display: block; margin-bottom: 8px; padding: 6px 8px; }\n.error { color: red; font-size: 0.9em; margin-top: -6px; margin-bottom: 8px; }\n`, { overwrite: true });

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
    writer.writeLine("  <div>");
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

  sf.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  sf.addImportDeclaration({ moduleSpecifier: "react", namedImports: ["useEffect", "useState"] });

  const compName = `${component.name}`;
  const fn = sf.addFunction({ name: compName, isExported: true });

  fn.setBodyText((writer) => {
    if (component.form && component.form.fields && component.form.fields.length > 0) {
      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        writer.writeLine(`const [${varName}, set_${varName}] = useState("");`);
      }

      writer.writeLine(`const [errors, set_errors] = useState({} as Record<string,string>);`);
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

      writer.writeLine(`return (`);
      writer.writeLine(`  <form className=\"form\" onSubmit={onSubmit}>`);

      for (const f of component.form.fields) {
        const varName = f.name.replace(/[^a-zA-Z0-9_]/g, "_");
        const label = f.label ?? f.name;
        const inputType = (f.type === "number") ? "number" : "text";
        writer.writeLine(`    <label>${label}</label>`);
        writer.writeLine(`    <input name=\"${f.name}\" value={${varName}} onChange={(e) => set_${varName}(e.target.value)} type=\"${inputType}\" />`);
        writer.writeLine(`    {errors[\"${f.name}\"] && <div className=\"error\">{errors[\"${f.name}\"]}</div>}`);
        writer.writeLine("");
      }

      writer.writeLine(`    <button type=\"submit\">Submit</button>`);
      writer.writeLine(`  </form>`);
      writer.writeLine(`);`);

    } else {
      writer.writeLine(`return (`);
      writer.writeLine(`  <div>`);
      if (component.entityRef) {
        writer.writeLine(`    <div>Component tied to entity: ${component.entityRef}</div>`);
      } else {
        writer.writeLine(`    <div>Static component: ${component.name}</div>`);
      }
      writer.writeLine(`  </div>`);
      writer.writeLine(`);`);
    }
  });
}
