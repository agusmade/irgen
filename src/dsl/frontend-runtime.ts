import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DeclFrontendApp, DeclComponent, DeclPage, DeclFrontendAppSchema } from "../ir/decl/frontend.raw.schema.js";

let CURRENT_FRONTEND: DeclFrontendApp | null = null;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

// Runtime types with helper methods
export type RuntimeComponent = DeclComponent & {
  field: (fieldName: string, type: string, label?: string, validators?: Record<string, any>, config?: any) => void;
  prop: (key: string, value: string) => void;
  // helpers (these are functions in DSL, but they populate IR properties)
  hero: (data: any) => void;
  features: (items: any[], opts?: any) => void;
  testimonials: (items: any[], opts?: any) => void;
  faq: (items: any[], opts?: any) => void;
  logos: (items: any[], opts?: any) => void;
  cta: (title: string, subtitle?: string, actions?: any[]) => void;
  stats: (items: any[], opts?: any) => void;
  timeline: (items: any[], opts?: any) => void;
  enableThemeToggle: () => void;
  code: (snippet: string, language?: string, options?: { showLineNumbers?: boolean }) => void;
};

type FrontendOptions = {
  pwa?: DeclFrontendApp["pwa"];
  meta?: Record<string, any>;
  policies?: Record<string, any>;
};

function mergePolicy(target: string, value: Record<string, any>) {
  if (!CURRENT_FRONTEND) return;
  CURRENT_FRONTEND.meta = CURRENT_FRONTEND.meta ?? {};
  const existing = (CURRENT_FRONTEND.meta.policies ?? {}) as Record<string, any>;
  CURRENT_FRONTEND.meta.policies = { ...existing, [target]: { ...(existing[target] ?? {}), ...value } };
}

export function frontend(
  name: string,
  optsOrFn: FrontendOptions | ((a: {
    page: (name: string, opts: { path: string, hideHeader?: boolean, description?: string }, cb?: (p: { component: (name: string, cb?: (c: RuntimeComponent) => void) => void }) => void) => void;
    component: (name: string, cb?: (c: RuntimeComponent) => void) => void;
    meta: (key: string, value: unknown) => void;
    policy: (target: string, value: Record<string, any>) => void;
  }) => void),
  maybeFn?: (a: {
    page: (name: string, opts: { path: string, hideHeader?: boolean, description?: string }, cb?: (p: { component: (name: string, cb?: (c: RuntimeComponent) => void) => void }) => void) => void;
    component: (name: string, cb?: (c: RuntimeComponent) => void) => void;
    meta: (key: string, value: unknown) => void;
    policy: (target: string, value: Record<string, any>) => void;
  }) => void,
) {
  assert(typeof name === "string" && name.length > 0, "frontend(name) harus string");

  const opts = (typeof optsOrFn === "function" ? {} : optsOrFn) ?? {};
  const fn = (typeof optsOrFn === "function" ? optsOrFn : maybeFn) as ((a: {
    page: (name: string, opts: { path: string, hideHeader?: boolean, description?: string }, cb?: (p: { component: (name: string, cb?: (c: RuntimeComponent) => void) => void }) => void) => void;
    component: (name: string, cb?: (c: RuntimeComponent) => void) => void;
    meta: (key: string, value: unknown) => void;
    policy: (target: string, value: Record<string, any>) => void;
  }) => void);

  assert(typeof fn === "function", "frontend(..., fn) fn harus function");

  const baseMeta = opts?.meta ?? {};
  CURRENT_FRONTEND = {
    type: "frontend",
    name,
    pages: [],
    components: [],
    ...(opts?.pwa ? { pwa: opts.pwa } : {}),
    meta: { ...baseMeta },
  };
  if (opts?.policies) {
    for (const [target, value] of Object.entries(opts.policies)) {
      mergePolicy(target, value as Record<string, any>);
    }
  }

  fn({
    page(pName, opts, cb) {
      assert(CURRENT_FRONTEND, "page() harus di dalam frontend()");
      const page: DeclPage = {
        type: "page",
        name: pName,
        path: opts.path,
        hideHeader: opts.hideHeader,
        description: opts.description,
        components: []
      };
      if (typeof cb === "function") {
        cb({
          component(cName, cCb) {
            const comp = { type: "component", name: cName, props: {}, form: { fields: [] } } as unknown as RuntimeComponent;

            // attach helpers
            comp.field = function (fieldName: string, type: string, label?: string, validators?: Record<string, any>, config?: any) {
              comp.form = comp.form ?? { fields: [] };
              comp.form.fields.push({ name: fieldName, type, label, validators, ...config });
            };
            comp.prop = function (key: string, value: string) {
              comp.props = comp.props ?? {};
              comp.props[key] = value;
            };
            comp.hero = function (data: any) { comp.marketing = { kind: "hero", ...data }; };
            comp.features = function (items: any[], opts?: any) { comp.marketing = { kind: "features", items, ...opts }; };
            comp.testimonials = function (items: any[], opts?: any) { comp.marketing = { kind: "testimonials", items, ...opts }; };
            comp.faq = function (items: any[], opts?: any) { comp.marketing = { kind: "faq", items, ...opts }; };
            comp.logos = function (items: any[], opts?: any) { comp.marketing = { kind: "logos", items, ...opts }; };
            comp.cta = function (title: string, subtitle?: string, actions?: any[]) { comp.marketing = { kind: "cta", title, subtitle, actions }; };
            comp.stats = function (items: any[], opts?: any) { comp.marketing = { kind: "stats", items, ...opts }; };
            comp.timeline = function (items: any[], opts?: any) { comp.marketing = { kind: "timeline", items, ...opts }; };
            comp.enableThemeToggle = function () { (comp as any).themeToggle = true; };
            comp.code = function (snippet: string, language: string = "typescript", options?: { showLineNumbers?: boolean }) {
              (comp as any).codeBlock = { snippet, language, showLineNumbers: options?.showLineNumbers ?? true };
            };

            if (typeof cCb === "function") cCb(comp);
            page.components.push(comp);
            if (CURRENT_FRONTEND) CURRENT_FRONTEND.components.push(comp);
          }
        });
      }
      if (CURRENT_FRONTEND) CURRENT_FRONTEND.pages.push(page);
    },
    component(name, cb) {
      assert(CURRENT_FRONTEND, "component() harus di dalam frontend()");
      const comp = { type: "component", name: name, props: {}, form: { fields: [] } } as unknown as RuntimeComponent;

      // add convenience methods to the comp object for DSL users: field() and prop()
      comp.field = function (fieldName: string, type: string, label?: string, validators?: Record<string, any>, config?: any) {
        comp.form = comp.form ?? { fields: [] };
        comp.form.fields.push({ name: fieldName, type, label, validators, ...config });
      };
      comp.prop = function (key: string, value: string) {
        comp.props = comp.props ?? {};
        comp.props[key] = value;
      };
      comp.hero = function (data: any) { comp.marketing = { kind: "hero", ...data }; };
      comp.features = function (items: any[], opts?: any) { comp.marketing = { kind: "features", items, ...opts }; };
      comp.testimonials = function (items: any[], opts?: any) { comp.marketing = { kind: "testimonials", items, ...opts }; };
      comp.faq = function (items: any[], opts?: any) { comp.marketing = { kind: "faq", items, ...opts }; };
      comp.logos = function (items: any[], opts?: any) { comp.marketing = { kind: "logos", items, ...opts }; };
      comp.cta = function (title: string, subtitle?: string, actions?: any[]) { comp.marketing = { kind: "cta", title, subtitle, actions }; };
      comp.stats = function (items: any[], opts?: any) { comp.marketing = { kind: "stats", items, ...opts }; };
      comp.timeline = function (items: any[], opts?: any) { comp.marketing = { kind: "timeline", items, ...opts }; };
      comp.enableThemeToggle = function () { (comp as any).themeToggle = true; };
      comp.code = function (snippet: string, language: string = "typescript", options?: { showLineNumbers?: boolean }) {
        (comp as any).codeBlock = { snippet, language, showLineNumbers: options?.showLineNumbers ?? true };
      };

      if (typeof cb === "function") cb(comp);
      if (CURRENT_FRONTEND) CURRENT_FRONTEND.components.push(comp);
    },
    meta(key: string, value: unknown) {
      assert(CURRENT_FRONTEND, "meta() harus di dalam frontend()");
      CURRENT_FRONTEND.meta = CURRENT_FRONTEND.meta ?? {};
      (CURRENT_FRONTEND.meta as any)[key] = value;
    },
    policy(target: string, value: Record<string, any>) {
      assert(CURRENT_FRONTEND, "policy() harus di dalam frontend()");
      mergePolicy(target, value);
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
      // keep temp file in same dir so relative imports remain valid
      const tmp = path.join(path.dirname(abs), `.dsl-tmp-${Date.now()}.mjs`);
      await (await import("node:fs/promises")).writeFile(tmp, transpiled, "utf-8");
      await import(pathToFileURL(tmp).href);
      // best-effort cleanup
      try { await (await import("node:fs/promises")).unlink(tmp); } catch (_) { }
    } catch (err2: any) {
      throw new Error(`Failed to load frontend DSL (${entry}): ${err2?.message ?? err2}`);
    }
  }

  if (!CURRENT_FRONTEND) throw new Error(`Frontend DSL did not call frontend(...)`);
  const parsed = DeclFrontendAppSchema.parse(CURRENT_FRONTEND);
  return parsed;
}
