import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DeclFrontendApp, DeclComponent, DeclPage, DeclFrontendAppSchema } from "../ir/decl/frontend.raw.schema.js";

// Use globalThis to share state across multiple module instances (e.g., src vs dist)
const _global = globalThis as any;
_global.__IR_FRONTEND_APPS = _global.__IR_FRONTEND_APPS || [];
_global.__IR_CURRENT_FRONTEND = _global.__IR_CURRENT_FRONTEND || null;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

// Runtime types with helper methods
export type RuntimeComponent = Omit<DeclComponent, "agentChat" | "cliUsage" | "table" | "macro"> & {
  field: (fieldName: string, type: string, label?: string, validators?: Record<string, any>, config?: any) => void;
  prop: (key: string, value: string) => void;
  // helpers (these are functions in DSL, but they populate IR properties)
  agentChat: (data: { title?: string; messages: Array<{ role: "user" | "agent"; label?: string; content: string }> }) => void;
  cliUsage: (data: { title?: string; command: string; options?: Array<{ flag: string; description: string }> }) => void;
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
  table: (data: { resourceId?: string; operationId?: string; columns?: Array<{ header: string; accessor: string; render?: string }> }) => void;
  useMacro: (type: string, props?: Record<string, any>) => void;
};

type FrontendOptions = {
  basePath?: string;
  pwa?: DeclFrontendApp["pwa"];
  auth?: DeclFrontendApp["auth"];
  meta?: Record<string, any>;
  policies?: Record<string, any>;
  datasources?: DeclFrontendApp["datasources"];
  operations?: DeclFrontendApp["operations"];
  resources?: DeclFrontendApp["resources"];
  requiredComponentKeys?: string[];
};

function mergePolicy(target: string, value: Record<string, any>) {
  if (!_global.__IR_CURRENT_FRONTEND) return;
  _global.__IR_CURRENT_FRONTEND.meta = _global.__IR_CURRENT_FRONTEND.meta ?? {};
  const existing = (_global.__IR_CURRENT_FRONTEND.meta.policies ?? {}) as Record<string, any>;
  _global.__IR_CURRENT_FRONTEND.meta.policies = { ...existing, [target]: { ...(existing[target] ?? {}), ...value } };
}

const RUNTIME_HELPERS = [
  "field",
  "prop",
  "agentChat",
  "cliUsage",
  "hero",
  "features",
  "testimonials",
  "faq",
  "logos",
  "cta",
  "stats",
  "timeline",
  "enableThemeToggle",
  "code",
  "table",
  "useMacro",
];

function stripRuntimeHelpers(comp: Record<string, any>) {
  for (const key of RUNTIME_HELPERS) {
    if (typeof comp[key] === "function") {
      delete comp[key];
    }
  }
}

export function datasource(id: string, config: any) {
  assert(_global.__IR_CURRENT_FRONTEND, "datasource() harus di dalam frontend()");
  _global.__IR_CURRENT_FRONTEND.datasources.push({ id, ...config });
}

export function operation(id: string, config: any) {
  assert(_global.__IR_CURRENT_FRONTEND, "operation() harus di dalam frontend()");
  _global.__IR_CURRENT_FRONTEND.operations.push({ id, ...config });
}

export function resource(id: string, config: any) {
  assert(_global.__IR_CURRENT_FRONTEND, "resource() harus di dalam frontend()");
  _global.__IR_CURRENT_FRONTEND.resources.push({ id, ...config });
}

export function meta(key: string, value: unknown) {
  assert(_global.__IR_CURRENT_FRONTEND, "meta() harus di dalam frontend()");
  _global.__IR_CURRENT_FRONTEND.meta = _global.__IR_CURRENT_FRONTEND.meta ?? {};
  (_global.__IR_CURRENT_FRONTEND.meta as any)[key] = value;
}

export function policy(target: string, value: Record<string, any>) {
  assert(_global.__IR_CURRENT_FRONTEND, "policy() harus di dalam frontend()");
  mergePolicy(target, value);
}

export function requiredComponents(keys: string[]) {
  assert(_global.__IR_CURRENT_FRONTEND, "requiredComponents() harus di dalam frontend()");
  _global.__IR_CURRENT_FRONTEND.requiredComponentKeys = keys;
}

export function page(pName: string, opts: { path: string, hideHeader?: boolean, description?: string, docsLayout?: boolean, docsGroupLabel?: string }, cb?: (p: { component: (name: string, cb?: (c: RuntimeComponent) => void) => void }) => void) {
  assert(_global.__IR_CURRENT_FRONTEND, "page() harus di dalam frontend()");
  const page: DeclPage = {
    type: "page",
    name: pName,
    path: opts.path,
    hideHeader: opts.hideHeader,
    description: opts.description,
    docsLayout: opts.docsLayout,
    docsGroupLabel: opts.docsGroupLabel,
    components: []
  };
  if (typeof cb === "function") {
    cb({
      component(cName, cCb) {
        const comp = { type: "component", name: cName, props: {}, form: { fields: [] } } as unknown as RuntimeComponent;

        // add convenience methods to the comp object for DSL users: field() and prop()
        comp.field = function (fieldName: string, type: string, label?: string, validators?: Record<string, any>, config?: any) {
          comp.form = comp.form ?? { fields: [] };
          comp.form.fields.push({ name: fieldName, type, label, validators, ...config });
        };
        comp.prop = function (key: string, value: string) {
          comp.props = comp.props ?? {};
          comp.props[key] = value;
        };
        comp.agentChat = function (data: { title?: string; messages: Array<{ role: "user" | "agent"; label?: string; content: string }> }) {
          (comp as any).agentChat = data;
        };
        comp.cliUsage = function (data: { title?: string; command: string; options?: Array<{ flag: string; description: string }> }) {
          (comp as any).cliUsage = data;
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
        comp.table = function (data: any) { (comp as any).table = data; };
        comp.useMacro = function (type: string, props?: Record<string, any>) {
          (comp as any).macro = type;
          if (props) comp.props = props;
        };

        if (typeof cCb === "function") cCb(comp);
        stripRuntimeHelpers(comp as any);
        if ((comp as any).html) {
          throw new Error(`component.html is not allowed (component: ${comp.name}). Use component.content with Markdown instead.`);
        }
        const finalized = comp as unknown as DeclComponent;
        page.components.push(finalized);
        if (_global.__IR_CURRENT_FRONTEND) _global.__IR_CURRENT_FRONTEND.components.push(finalized);
      }
    });
  }
  if (_global.__IR_CURRENT_FRONTEND) _global.__IR_CURRENT_FRONTEND.pages.push(page);
}

export function component(name: string, cb: (c: RuntimeComponent) => void) {
  assert(_global.__IR_CURRENT_FRONTEND, "component() harus di dalam frontend()");
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
  comp.agentChat = function (data: { title?: string; messages: Array<{ role: "user" | "agent"; label?: string; content: string }> }) {
    (comp as any).agentChat = data;
  };
  comp.cliUsage = function (data: { title?: string; command: string; options?: Array<{ flag: string; description: string }> }) {
    (comp as any).cliUsage = data;
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
  comp.table = function (data: any) { (comp as any).table = data; };
  comp.useMacro = function (type: string, props?: Record<string, any>) {
    (comp as any).macro = type;
    if (props) comp.props = props;
  };

  if (typeof cb === "function") cb(comp);
  stripRuntimeHelpers(comp as any);
  if ((comp as any).html) {
    throw new Error(`component.html is not allowed (component: ${comp.name}). Use component.content with Markdown instead.`);
  }
  if (_global.__IR_CURRENT_FRONTEND) _global.__IR_CURRENT_FRONTEND.components.push(comp as unknown as DeclComponent);
}

type FrontendCallbackArgs = {
  page: typeof page;
  component: typeof component;
  datasource: typeof datasource;
  operation: typeof operation;
  resource: typeof resource;
  meta: typeof meta;
  policy: typeof policy;
  requiredComponents: typeof requiredComponents;
};

export function frontend(
  name: string,
  optsOrFn: FrontendOptions | ((a: FrontendCallbackArgs) => void),
  maybeFn?: (a: FrontendCallbackArgs) => void,
) {
  assert(typeof name === "string" && name.length > 0, "frontend(name) harus string");

  const opts = (typeof optsOrFn === "function" ? {} : optsOrFn) ?? {};
  const fn = (typeof optsOrFn === "function" ? optsOrFn : maybeFn) as ((a: FrontendCallbackArgs) => void);

  assert(typeof fn === "function", "frontend(..., fn) fn harus function");

  const baseMeta = opts?.meta ?? {};
  _global.__IR_CURRENT_FRONTEND = {
    type: "frontend",
    name,
    basePath: opts?.basePath ?? "/",
    pages: [],
    components: [],
    datasources: opts?.datasources ?? [],
    operations: opts?.operations ?? [],
    resources: opts?.resources ?? [],
    ...(opts?.pwa ? { pwa: opts.pwa } : {}),
    ...(opts?.auth ? { auth: opts.auth } : {}),
    ...(opts?.requiredComponentKeys ? { requiredComponentKeys: opts.requiredComponentKeys } : {}),
    meta: { ...baseMeta },
  };
  if (opts?.policies) {
    for (const [target, value] of Object.entries(opts.policies)) {
      mergePolicy(target, value as Record<string, any>);
    }
  }

  fn({
    datasource,
    operation,
    resource,
    page,
    component,
    meta,
    policy,
    requiredComponents,
  });

  const parsed = DeclFrontendAppSchema.parse(_global.__IR_CURRENT_FRONTEND);
  _global.__IR_CURRENT_FRONTEND = parsed;
  _global.__IR_FRONTEND_APPS.push(parsed);
  return parsed;
}

export async function loadFrontendDsl(entry: string): Promise<DeclFrontendApp> {
  const abs = path.resolve(process.cwd(), entry);
  const url = pathToFileURL(abs).href;

  // reset
  _global.__IR_FRONTEND_APPS = [];
  _global.__IR_CURRENT_FRONTEND = null;

  try {
    // Add cache buster to force re-execution if file is already in module cache
    const cacheBuster = `?cb=${Date.now()}`;
    await import(url + cacheBuster);
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

  if (_global.__IR_FRONTEND_APPS.length === 0) throw new Error(`Frontend DSL did not call frontend(...)`);
  return _global.__IR_FRONTEND_APPS.length === 1 ? _global.__IR_FRONTEND_APPS[0] : _global.__IR_FRONTEND_APPS;
}
