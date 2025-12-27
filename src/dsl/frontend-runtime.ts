import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DeclFrontendApp, DeclComponent, DeclPage, DeclFrontendAppSchema } from "../ir/frontend.js";

let CURRENT_FRONTEND: DeclFrontendApp | null = null;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

export function frontend(name: string, fn: (a: { page: (name: string, opts: { path: string }, cb?: (p: any) => void) => void; component: (name: string, cb?: (c: any) => void) => void; }) => void) {
  assert(typeof name === "string" && name.length > 0, "frontend(name) harus string");
  assert(typeof fn === "function", "frontend(..., fn) fn harus function");

  CURRENT_FRONTEND = { type: "frontend", name, pages: [], components: [] };

  fn({
    page(pName, opts, cb) {
      assert(CURRENT_FRONTEND, "page() harus di dalam frontend()");
      const page: DeclPage = { type: "page", name: pName, path: opts.path, components: [] } as any;
      if (typeof cb === "function") {
        cb({ component(cName, cCb) { const comp: DeclComponent = { type: "component", name: cName }; if (typeof cCb === "function") cCb(comp); page.components.push(comp); } });
      }
      CURRENT_FRONTEND.pages.push(page);
    },
    component(name, cb) {
      assert(CURRENT_FRONTEND, "component() harus di dalam frontend()");
      const comp: DeclComponent = { type: "component", name, props: {}, form: { fields: [] } } as any;

      // add convenience methods to the comp object for DSL users: field() and prop()
      comp.field = function (fieldName: string, type: string, label?: string, validators?: Record<string, any>) {
        comp.form = comp.form ?? { fields: [] };
        comp.form.fields.push({ name: fieldName, type, label, validators });
      } as any;

      comp.prop = function (key: string, value: string) {
        comp.props = comp.props ?? {};
        comp.props[key] = value;
      } as any;

      if (typeof cb === "function") cb(comp as any);

      CURRENT_FRONTEND.components.push(comp);
    },
  });

  const parsed = DeclFrontendAppSchema.parse(CURRENT_FRONTEND);
  CURRENT_FRONTEND = parsed;
  return parsed;
}

export async function loadFrontendDsl(entry: string): Promise<DeclFrontendApp> {
  const abs = path.resolve(process.cwd(), entry);
  const url = pathToFileURL(abs).href;

  // reset
  CURRENT_FRONTEND = null;

  try {
    await import(url);
  } catch (err: any) {
    // Some environments (tsx ESM loader) may fail resolving .ts imports via file URL.
    // Fall back to transpile the TypeScript file to a temporary .mjs and import that.
    console.warn("frontend loader dynamic import failed, attempting transpile fallback:", err?.message ?? err);

    try {
      const ts = await import("typescript");
      const src = await (await import("node:fs/promises")).readFile(abs, "utf-8");
      const transpiled = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
      const tmp = path.join((await import("node:os")).tmpdir(), `dsl-${Date.now()}.mjs`);
      await (await import("node:fs/promises")).writeFile(tmp, transpiled, "utf-8");
      await import(pathToFileURL(tmp).href);
      // best-effort cleanup
      try { await (await import("node:fs/promises")).unlink(tmp); } catch (_) {}
    } catch (err2) {
      throw new Error(`Failed to load frontend DSL (${entry}): ${err2?.message ?? err2}`);
    }
  }

  if (!CURRENT_FRONTEND) throw new Error(`Frontend DSL did not call frontend(...)`);
  const parsed = DeclFrontendAppSchema.parse(CURRENT_FRONTEND);
  return parsed;
}
