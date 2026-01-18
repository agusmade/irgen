import path from "node:path";
import type { Project } from "ts-morph";
import type { FrontendPage } from "../../ir/domain/frontend.js";
import { pascal, kebab } from "../../utils/string.js";

export function emitPage(project: Project, frontendDir: string, page: FrontendPage) {
  const dir = path.join(frontendDir, "pages");
  project.createDirectory(dir);
  const filePath = path.join(dir, `${kebab(page.name)}.tsx`);
  const sf = project.createSourceFile(filePath, "", { overwrite: true });

  sf.addImportDeclaration({ moduleSpecifier: "react", defaultImport: "React" });
  sf.addImportDeclaration({ moduleSpecifier: "react", namedImports: ["useEffect", "useState"] });

  const layoutChildren = new Set<string>();
  for (const c of page.components) {
    c.layout?.items?.forEach((name) => layoutChildren.add(name));
    c.layout?.tabs?.forEach((tab) => tab.items?.forEach((name) => layoutChildren.add(name)));
  }
  const renderComponents = page.components.filter((c) => !layoutChildren.has(c.name));
  for (const c of renderComponents) {
    sf.addImportDeclaration({ moduleSpecifier: `../components/${kebab(c.name)}`, namedImports: [pascal(c.name)] });
  }

  const compName = `${pascal(page.name)}Page`;
  const fn = sf.addFunction({ name: compName, isExported: true });
  fn.setBodyText((writer) => {
    const sectionGap = page.docsLayout ? "space-y-6" : "space-y-12";
    const gridGap = page.docsLayout ? "gap-6" : "gap-12";
    writer.writeLine("return (");
    writer.writeLine(`  <div className="${sectionGap} animate-in fade-in slide-in-from-bottom-4 duration-500">`);

    if (!page.hideHeader) {
      writer.writeLine("    <header className=\"border-b border-slate-200 dark:border-slate-800 pb-6\">");
      writer.writeLine(`      <div className=\"flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3\">`);
      writer.writeLine(`         <span>Section</span>`);
      writer.writeLine(`         <span className=\"w-6 h-px bg-slate-200 dark:bg-slate-800\"></span>`);
      writer.writeLine(`         <span>${page.name}</span>`);
      writer.writeLine(`      </div>`);
      writer.writeLine(`      <h1 className=\"text-2xl md:text-3xl font-bold text-slate-950 dark:text-white tracking-tight\">${page.name}</h1>`);

      const description = page.description || `Manage your ${page.name.toLowerCase()} assets and application state in this unified view.`;
      writer.writeLine(`      <p className=\"mt-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-3xl\">${description}</p>`);
      writer.writeLine("    </header>");
    }

    writer.writeLine(`    <div className="grid ${gridGap}">`);
    for (const c of renderComponents) {
      const sectionClass = page.docsLayout
        ? "relative shrink-0 overflow-x-hidden"
        : "relative shrink-0";
      writer.writeLine(`      <section className=\"${sectionClass}\">`);
      writer.writeLine(`        <${pascal(c.name)} />`);
      writer.writeLine(`      </section>`);
    }
    writer.writeLine("    </div>");
    writer.writeLine("  </div>");
    writer.writeLine(");");
  });
}
