import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DeclApp, DeclAppSchema, DeclEntity } from "../ir/decl/backend.raw.schema.js";

type EntityBuilder = {
  create(opName?: string): void;
  get(opName?: string): void;
  list(opName?: string): void;
  update(opName?: string): void;
  remove(opName?: string): void;
  // define model shape inline via object: { fieldName: "type" }
  model(fields: Record<string, string>): void;
  // optional: explicitly set plural form for list method naming
  plural(p: string): void;
  // allow customizing method names / skipping ops
  op(kind: "create" | "get" | "list" | "update" | "remove", options?: { name?: string; enabled?: boolean }): void;
};

type AppBuilder = {
  entity(name: string, fn: (e: EntityBuilder) => void): void;
  meta(key: string, value: unknown): void;
  policy(target: string, value: Record<string, any>): void;
};

let CURRENT: DeclApp | null = null;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

import { kebab } from "../utils/index.js";

function defaultEntityId(name: string) {
  return `${kebab(name)}`;
}

type AppOptions = {
  meta?: Record<string, any>;
  policies?: Record<string, any>;
};

function mergePolicy(target: string, value: Record<string, any>) {
  if (!CURRENT) return;
  CURRENT.meta = CURRENT.meta ?? {};
  const existing = (CURRENT.meta.policies ?? {}) as Record<string, any>;
  CURRENT.meta.policies = { ...existing, [target]: { ...(existing[target] ?? {}), ...value } };
}

export function app(name: string, fn: (a: AppBuilder) => void): void;
export function app(name: string, opts: AppOptions, fn: (a: AppBuilder) => void): void;
export function app(name: string, optsOrFn: AppOptions | ((a: AppBuilder) => void), maybeFn?: (a: AppBuilder) => void) {
  assert(typeof name === "string" && name.length > 0, "app(name) harus string");
  const opts = (typeof optsOrFn === "function" ? {} : optsOrFn) ?? {};
  const fn = (typeof optsOrFn === "function" ? optsOrFn : maybeFn) as (a: AppBuilder) => void;
  assert(typeof fn === "function", "app(..., fn) fn harus function");

  CURRENT = { type: "app", name, entities: [], meta: { ...(opts.meta ?? {}) } };
  if (opts.policies) {
    for (const [target, value] of Object.entries(opts.policies)) {
      mergePolicy(target, value as Record<string, any>);
    }
  }

  fn({
    entity(entityName, entityFn) {
      assert(CURRENT, "entity() harus di dalam app()");
      const entity: DeclEntity = {
        type: "entity",
        name: entityName,
        id: defaultEntityId(entityName),
        operations: [],
      };

      const eb: EntityBuilder = {
        create(opName) {
          entity.operations.push({ kind: "create", name: opName ?? "create" });
        },
        get(opName) {
          entity.operations.push({ kind: "get", name: opName ?? "get" });
        },
        list(opName) {
          entity.operations.push({ kind: "list", name: opName ?? "list" });
        },
        update(opName) {
          entity.operations.push({ kind: "update", name: opName ?? "update" });
        },
        remove(opName) {
          entity.operations.push({ kind: "remove", name: opName ?? "remove" });
        },
        model(fields) {
          // shallow copy
          entity.model = { ...(entity.model ?? {}), ...fields };
        },
        plural(p: string) {
          entity.plural = p;
        },
        op(kind, options) {
          if (options?.enabled === false) return;
          entity.operations.push({ kind, name: options?.name ?? kind });
        },
      };

      entityFn(eb);
      CURRENT.entities.push(entity);
    },
    meta(key, value) {
      assert(CURRENT, "meta() harus di dalam app()");
      CURRENT.meta[key] = value;
    },
    policy(target, value) {
      assert(CURRENT, "policy() harus di dalam app()");
      mergePolicy(target, value);
    },
  });
}

/**
 * Load DSL file (TS/JS) by dynamic import.
 * - Untuk proyek ini: jalankan CLI via `tsx` (default).
 * - Jika ingin `node dist/cli.js`, file DSL tetap bisa TS karena tsconfig include, tapi runtime Node butuh JS/ESM.
 */
export async function loadDsl(entry: string): Promise<DeclApp> {
  const abs = path.resolve(process.cwd(), entry);
  const url = pathToFileURL(abs).href;

  // reset
  CURRENT = null;

  try {
    await import(url);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.warn("backend loader dynamic import failed, attempting transpile fallback:", errMessage);
    try {
      const ts = await import("typescript");
      const src = await (await import("node:fs/promises")).readFile(abs, "utf-8");
      const transpiled = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
      const tmp = path.join((await import("node:os")).tmpdir(), `dsl-${Date.now()}.mjs`);
      await (await import("node:fs/promises")).writeFile(tmp, transpiled, "utf-8");
      await import(pathToFileURL(tmp).href);
      // best-effort cleanup
      try { await (await import("node:fs/promises")).unlink(tmp); } catch (_) {}
    } catch (err2: unknown) {
      const err2Message = err2 instanceof Error ? err2.message : String(err2);
      throw new Error(`Failed to load DSL (${entry}): ${err2Message}`);
    }
  }

  assert(CURRENT, `DSL tidak memanggil app(...) — file: ${entry}`);

  // validate + normalize
  const parsed = DeclAppSchema.parse(CURRENT);
  return parsed;
}
