import path from "node:path";
import fs from "node:fs";
import { Project } from "ts-morph";
import type { FrontendTargetIR } from "../../ir/target/frontend.js";

export function emitRuntime(project: Project, srcDir: string, ir: FrontendTargetIR) {
    const libDir = path.join(srcDir, "lib");
    if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });

    emitRuntimeContract(project, libDir);
    emitRuntimeImplementation(project, libDir);
    emitRuntimeConfig(project, libDir, ir);
    emitRuntimeHooks(project, libDir);
}

function emitRuntimeContract(project: Project, libDir: string) {
    const filePath = path.join(libDir, "runtime-contract.ts");
    const content = `/**
 * Frontend Core — Runtime Contract
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
export type ResponseType = "json" | "text" | "html" | "blob";
export type BodyType = "none" | "json" | "text" | "multipart" | "formUrlEncoded";

export type Dict<T = unknown> = Record<string, T>;
export type PathParams = Record<string, string | number>;
export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type OperationContext =
  | { kind: "page"; pageId: string }
  | { kind: "tableRow"; pageId: string; rowId: string }
  | { kind: "tableBulk"; pageId: string; selectedIds: string[] }
  | { kind: "form"; pageId: string; formId: string }
  | { kind: "system"; reason: string };

export type NormalizedErrorCode =
  | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR"
  | "CONFLICT" | "RATE_LIMITED" | "TIMEOUT" | "NETWORK_ERROR"
  | "INTERNAL_ERROR" | "UNKNOWN_ERROR";

export interface FieldError { field: string; message: string; code?: string; }

export interface NormalizedError {
  code: NormalizedErrorCode;
  message: string;
  status?: number;
  details?: Dict;
  fieldErrors?: FieldError[];
  cause?: unknown;
  raw?: unknown;
}

export type AuthState =
  | { status: "anonymous" }
  | { status: "authenticated"; user?: Dict; roles?: string[] }
  | { status: "error"; error: NormalizedError };

export type AuthStrategyId = string;
export interface AuthStrategy {
  id: AuthStrategyId;
  attach(req: RuntimeRequest, ds: DataSourceRuntimeConfig): Promise<RuntimeRequest>;
  loadState?: (rt: Runtime, dsId: string) => Promise<AuthState>;
  onLoginSuccess?: (rt: Runtime, dsId: string, payload: unknown) => Promise<void>;
  onLogout?: (rt: Runtime, dsId: string) => Promise<void>;
}

export type CsrfStrategyId = string;
export interface CsrfStrategy {
  id: CsrfStrategyId;
  attach(req: RuntimeRequest, rt: Runtime, dsId: string): Promise<RuntimeRequest>;
}

export interface DataSourceRuntimeConfig {
  id: string;
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  withCredentials?: boolean;
  timeoutMs?: number;
  authStrategyId?: AuthStrategyId;
  csrfStrategyId?: CsrfStrategyId;
}

export interface EnvelopeAdapter {
  id: string;
  extractData: (payload: unknown) => unknown;
  extractMeta?: (payload: unknown) => unknown;
  extractErrorPayload?: (payload: unknown) => unknown;
}

export interface PaginationResult { total?: number; nextCursor?: string; prevCursor?: string; }
export interface PaginationAdapter { id: string; extract: (payload: unknown) => PaginationResult; }

export interface RequestBodySpec {
  type: BodyType;
  build?: (input: unknown, ctx: OperationContext, rt: Runtime) => Promise<unknown>;
  contentType?: string;
  accept?: string;
}

export interface ResponseSpec {
  type: ResponseType;
  envelopeAdapterId?: string;
  paginationAdapterId?: string;
  filenameHint?: string;
}

export interface ResultHandlingSpec {
  invalidate?: Array<{ kind: string; resourceId?: string; id?: string; operationId?: string; key?: any }>;
  redirectTo?: (result: OperationResultNormalized, rt: Runtime) => string | null;
  openUrl?: (result: OperationResultNormalized, rt: Runtime) => string | null;
  downloadAs?: (result: OperationResultNormalized, rt: Runtime) => { filename: string } | null;
  toastOnSuccess?: { kind: string; message: string };
  toastOnError?: { kind: string; message: string };
}

export interface OperationSpec {
  id: string;
  datasourceId: string;
  method: HttpMethod;
  path: string;
  pathParams?: (input: unknown, ctx: OperationContext, rt: Runtime) => Promise<PathParams>;
  query?: (input: unknown, ctx: OperationContext, rt: Runtime) => Promise<QueryParams>;
  headers?: (input: unknown, ctx: OperationContext, rt: Runtime) => Promise<Record<string, string>>;
  body?: RequestBodySpec;
  response: ResponseSpec;
  resultHandling?: ResultHandlingSpec;
  requiresAuth?: boolean;
  requiredRoles?: string[];
}

export interface ResourceSpec {
  id: string;
  datasourceId: string;
  idField?: string;
  listOpId?: string;
  getOpId?: string;
  createOpId?: string;
  updateOpId?: string;
  deleteOpId?: string;
}

export interface RuntimeRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: unknown;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  responseType: ResponseType;
}

export interface OperationResultNormalized {
  ok: boolean;
  status?: number;
  data?: unknown;
  meta?: unknown;
  pagination?: PaginationResult;
  error?: NormalizedError;
  raw?: unknown;
}

export interface Runtime {
  getDataSource(dsId: string): DataSourceRuntimeConfig;
  getAuthState(dsId: string): AuthState;
  execute(operationId: string, input: unknown, ctx: OperationContext): Promise<OperationResultNormalized>;
  invalidate?(targets: any[]): void;
}
`;
    project.createSourceFile(filePath, content, { overwrite: true });
}

function emitRuntimeImplementation(project: Project, libDir: string) {
    const filePath = path.join(libDir, "runtime.ts");
    const content = `import type * as T from "./runtime-contract";

export class BaseRuntime implements T.Runtime {
  private authStates: Record<string, T.AuthState> = {};
  private listeners: Record<string, Array<(payload: any) => void>> = {};

  constructor(
    private datasources: T.DataSourceRuntimeConfig[],
    private operations: T.OperationSpec[],
    private adapters: {
      envelope: T.EnvelopeAdapter[];
      pagination: T.PaginationAdapter[];
    },
    private strategies: {
      auth: Record<string, T.AuthStrategy>;
      csrf: Record<string, T.CsrfStrategy>;
    }
  ) {}

  getDataSource(dsId: string): T.DataSourceRuntimeConfig {
    const ds = this.datasources.find((d) => d.id === dsId);
    if (!ds) throw new Error(\`DataSource not found: \${dsId}\`);
    return ds;
  }

  getAuthState(dsId: string): T.AuthState {
    return this.authStates[dsId] || { status: "anonymous" };
  }

  setAuthState(dsId: string, state: T.AuthState) {
    this.authStates[dsId] = state;
  }

  async execute(
    operationId: string,
    input: unknown,
    ctx: T.OperationContext
  ): Promise<T.OperationResultNormalized> {
    const op = this.operations.find((o) => o.id === operationId);
    if (!op) throw new Error(\`Operation not found: \${operationId}\`);

    const ds = this.getDataSource(op.datasourceId);

    try {
      let url = \`\${ds.baseUrl}\${op.path}\`;
      
      if (op.pathParams) {
        const params = await op.pathParams(input, ctx, this);
        for (const [key, val] of Object.entries(params)) {
          url = url.replace(\`:\${key}\`, String(val));
        }
      }

      const queryParams = op.query ? await op.query(input, ctx, this) : {};
      const searchParams = new URLSearchParams();
      for (const [key, val] of Object.entries(queryParams)) {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      }
      if (searchParams.toString()) {
        url += (url.includes("?") ? "&" : "?") + searchParams.toString();
      }

      let headers: Record<string, string> = {
        ...ds.defaultHeaders,
        ...(op.headers ? await op.headers(input, ctx, this) : {}),
      };

      let body: any = undefined;
      if (op.body && op.body.type !== "none") {
        body = op.body.build ? await op.body.build(input, ctx, this) : input;
        
        if (op.body.type === "json" && typeof body !== "string" && !(body instanceof FormData)) {
          body = JSON.stringify(body);
          headers["Content-Type"] = op.body.contentType || "application/json";
        } else if (op.body.type === "text") {
          headers["Content-Type"] = op.body.contentType || "text/plain";
        } else if (op.body.type === "formUrlEncoded") {
          if (body instanceof URLSearchParams) {
            body = body.toString();
          } else if (body && typeof body === "object") {
            const params = new URLSearchParams();
            for (const [key, val] of Object.entries(body)) {
              if (val !== undefined && val !== null) params.append(key, String(val));
            }
            body = params.toString();
          }
          headers["Content-Type"] = op.body.contentType || "application/x-www-form-urlencoded";
        }
      }

      const req: T.RuntimeRequest = {
        url,
        method: op.method,
        headers,
        body,
        credentials: ds.withCredentials ? "include" : undefined,
        responseType: op.response.type,
      };

      let finalReq = req;
      if (ds.authStrategyId && this.strategies.auth[ds.authStrategyId]) {
        finalReq = await this.strategies.auth[ds.authStrategyId].attach(finalReq, ds);
      }
      if (ds.csrfStrategyId && this.strategies.csrf[ds.csrfStrategyId]) {
        finalReq = await this.strategies.csrf[ds.csrfStrategyId].attach(finalReq, this, ds.id);
      }

      const response = await fetch(finalReq.url, {
        method: finalReq.method,
        headers: finalReq.headers,
        body: finalReq.body as any,
        credentials: finalReq.credentials,
      });

      const result: T.OperationResultNormalized = {
        ok: response.ok,
        status: response.status,
      };

      if (!response.ok) {
        result.error = await this.normalizeError(response);
        if (op.resultHandling) {
          await this.handleResultSignals(op.resultHandling, result);
        }
        return result;
      }

      let rawPayload: any;
      if (op.response.type === "json") rawPayload = await response.json();
      else if (op.response.type === "blob") rawPayload = await response.blob();
      else rawPayload = await response.text();

      result.raw = rawPayload;

      if (op.response.envelopeAdapterId) {
        const adapter = this.adapters.envelope.find(a => a.id === op.response.envelopeAdapterId);
        if (adapter) {
          result.data = adapter.extractData(rawPayload);
          result.meta = adapter.extractMeta?.(rawPayload);
          const err = adapter.extractErrorPayload?.(rawPayload);
          if (err) { result.ok = false; result.error = { code: "UNKNOWN_ERROR", message: String(err), details: err }; }
        } else { result.data = rawPayload; }
      } else { result.data = rawPayload; }

      if (op.response.paginationAdapterId) {
        const adapter = this.adapters.pagination.find(a => a.id === op.response.paginationAdapterId);
        if (adapter) result.pagination = adapter.extract(rawPayload);
      }

      if (op.resultHandling) {
        await this.handleResultSignals(op.resultHandling, result);
      }
      return result;
    } catch (err: any) {
      const result = { ok: false, error: { code: "INTERNAL_ERROR", message: err.message, cause: err } } as T.OperationResultNormalized;
      if (op?.resultHandling) {
        await this.handleResultSignals(op.resultHandling, result);
      }
      return result;
    }
  }

  private async normalizeError(response: Response): Promise<T.NormalizedError> {
    const status = response.status;
    let code: T.NormalizedErrorCode = "INTERNAL_ERROR";
    if (status === 401) code = "UNAUTHORIZED";
    else if (status === 403) code = "FORBIDDEN";
    else if (status === 404) code = "NOT_FOUND";
    else if (status === 422) code = "VALIDATION_ERROR";

    let message = response.statusText;
    let details: any = {};
    try {
      const payload = await response.json();
      message = payload.message || message;
      details = payload;
    } catch (_) {}

    return { code, message, status, details };
  }

  invalidate(targets: any[]): void {
      this.emit("invalidate", { targets });
  }

  on(event: string, fn: (payload: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
    return () => {
      this.listeners[event] = this.listeners[event].filter((l) => l !== fn);
    };
  }

  emit(event: string, payload: any) {
    const fns = this.listeners[event] || [];
    fns.forEach((fn) => fn(payload));
  }

  private resolveSignalValue(value: any, result: T.OperationResultNormalized) {
    if (value && typeof value === "object" && "logic" in value) {
      return (this as any).evalLogic(value.logic, undefined, { result });
    }
    if (typeof value === "function") {
      return value(result, this);
    }
    return value;
  }

  private async handleResultSignals(spec: T.ResultHandlingSpec, result: T.OperationResultNormalized) {
    if (spec.invalidate && typeof this.invalidate === "function") {
      this.invalidate(spec.invalidate);
    }

    if (result.ok && spec.toastOnSuccess) {
      this.emit("toast", { kind: spec.toastOnSuccess.kind, message: spec.toastOnSuccess.message });
    } else if (!result.ok && spec.toastOnError) {
      this.emit("toast", { kind: spec.toastOnError.kind, message: spec.toastOnError.message });
    }

    if (result.ok && spec.redirectTo) {
      const url = await this.resolveSignalValue(spec.redirectTo, result);
      if (url) {
        this.emit("redirect", { to: url });
        if (typeof window !== "undefined") {
          const nav = (window as any).__IRGEN_NAVIGATE__;
          if (typeof nav === "function") {
            nav(String(url));
          } else {
            const base = (window as any).__IRGEN_BASE_PATH__ || "";
            const target = (typeof url === "string" && url.startsWith("/") && base && base !== "/")
              ? String(base).replace(/\\/$/, "") + String(url)
              : String(url);
            window.location.assign(target);
          }
        }
      }

      if (typeof window !== "undefined" && spec.invalidate) {
        (window as any).__IRGEN_INVALIDATE_KEY__ = ((window as any).__IRGEN_INVALIDATE_KEY__ || 0) + 1;
      }
    }

    if (result.ok && spec.openUrl) {
      const url = await this.resolveSignalValue(spec.openUrl, result);
      if (url) {
        this.emit("openUrl", { url });
        if (typeof window !== "undefined") {
          window.open(String(url), "_blank");
        }
      }
    }

    if (result.ok && spec.downloadAs) {
      const opts = await this.resolveSignalValue(spec.downloadAs, result);
      if (opts && opts.filename) {
        this.emit("download", { filename: opts.filename, data: result.data, raw: result.raw });
        if (typeof window !== "undefined") {
          const payload = result.raw ?? result.data ?? "";
          const blob = payload instanceof Blob
            ? payload
            : new Blob(
              [typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)],
              { type: "application/octet-stream" },
            );
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = String(opts.filename);
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    }
  }
}
`;
    project.createSourceFile(filePath, content, { overwrite: true });
}

function emitRuntimeConfig(project: Project, libDir: string, ir: FrontendTargetIR) {
    const filePath = path.join(libDir, "runtime-instance.ts");

    const serializeLogic = (logic: any) => {
        if (!logic) return "undefined";
        return `async (input: any, ctx: any, rt: any) => (rt as any).evalLogic(${JSON.stringify(logic.logic)}, undefined, { ...input, ...ctx })`;
    };

    const opLines = ir.operations.map(op => `  {
    id: "${op.id}",
    datasourceId: "${op.datasourceId}",
    method: "${op.method}",
    path: "${op.path}",
    response: ${JSON.stringify(op.response)},
    requiresAuth: ${op.requiresAuth ?? false},
    ${op.pathParams ? `pathParams: ${serializeLogic(op.pathParams)},` : ""}
    ${op.query ? `query: ${serializeLogic(op.query)},` : ""}
    ${op.headers ? `headers: ${serializeLogic(op.headers)},` : ""}
    ${op.body ? `body: { type: "${op.body.type}", build: ${serializeLogic(op.body.build)} },` : ""}
    ${op.resultHandling ? `resultHandling: ${JSON.stringify(op.resultHandling)},` : ""}
  }`);

    const runtimeText = (ir.policies.frontend as any).visual?.copy?.runtimeText ?? {};
    const content = `import { BaseRuntime } from "./runtime";
import * as T from "./runtime-contract";

export const datasources: T.DataSourceRuntimeConfig[] = ${JSON.stringify(ir.datasources, null, 2)};

export const operations: T.OperationSpec[] = [
${opLines.join(",\n")}
];

export const resources: T.ResourceSpec[] = ${JSON.stringify(ir.resources, null, 2)};

export const envelopeAdapters: T.EnvelopeAdapter[] = [
  { id: "ok_data_meta", extractData: (p: any) => p?.data, extractMeta: (p: any) => p?.meta, extractErrorPayload: (p: any) => p?.error },
  { id: "items_cursor", extractData: (p: any) => p?.items, extractMeta: (p: any) => p?.meta, extractErrorPayload: (p: any) => p?.error }
];

export const paginationAdapters: T.PaginationAdapter[] = [
  { id: "cursor_root", extract: (p: any) => ({ nextCursor: p?.nextCursor }) }
];

export const runtime = new BaseRuntime(
  datasources,
  operations,
  { envelope: envelopeAdapters, pagination: paginationAdapters },
  { auth: {}, csrf: {} },
  ${JSON.stringify(runtimeText)}
);

const getByPath = (obj: any, path?: string) => {
  if (!path) return undefined;
  return path.split(".").reduce((acc: any, key: string) => (acc && typeof acc === "object") ? acc[key] : undefined, obj);
};
const isEmptyVal = (v: any): boolean => {
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object" && v !== null) {
    const vals = Object.values(v);
    return vals.length === 0 ? true : vals.every(isEmptyVal);
  }
  if (typeof v === "boolean") return !v;
  return (!v || v.toString().trim() === "");
};
const evalLogic = (logic: any, fallback?: any, logicCtx: any = {}): any => {
  const evalNode = (node: any): any => {
    if (node === undefined || node === null) return undefined;
    if (typeof node === "string") {
      const trimmed = node.trim();
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") return evalNode(parsed);
      } catch (_) {}
      const match = trimmed.match(/^([A-Za-z0-9_\\.]+)\\s*(==|===|!=|!==|>=|<=|>|<)\\s*(.+)$/);
      if (match) {
        const [, lhsKey, opSym, rhsRaw] = match;
        const lhs = getByPath(logicCtx, lhsKey);
        let rhs: any = rhsRaw;
        if (rhsRaw === "true") rhs = true;
        else if (rhsRaw === "false") rhs = false;
        else if (!isNaN(Number(rhsRaw))) rhs = Number(rhsRaw);
        else rhs = rhsRaw.replace(/^['"]|['"]$/g, "");
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
    const entries = Object.entries(node);
    if (entries.length === 0) return undefined;
    const [op, valRaw] = entries[0];
    const list = Array.isArray(valRaw) ? valRaw : [valRaw];
    const values = list.map(evalNode);
    switch (op) {
      case "var": return getByPath(logicCtx, values[0] as any);
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
      case "+": return values.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
      case "-": return values.length === 1 ? -(Number(values[0]) || 0) : (Number(values[0]) || 0) - (Number(values[1]) || 0);
      case "*": return values.reduce((a, b) => (Number(a) || 0) * (Number(b) || 0), 1);
      case "/": return values.length === 1 ? (Number(values[0]) || 0) : (Number(values[1]) ? (Number(values[0]) || 0) / (Number(values[1]) || 1) : undefined);
      case "%": return values.length === 1 ? Number(values[0]) % 1 : (Number(values[0]) || 0) % (Number(values[1]) || 1);
      default: {
        const out: any = {};
        for (const [k, v] of entries) {
          out[k] = evalNode(v);
        }
        return out;
      }
    }
  };
  const res = evalNode(logic);
  return (typeof res === "undefined") ? fallback : res;
};

(runtime as any).evalLogic = (logic: any, fallback: any, ctx: any) => {
  return evalLogic(logic, fallback, ctx);
};
`;
    project.createSourceFile(filePath, content, { overwrite: true });
}

function emitRuntimeHooks(project: Project, libDir: string) {
    const filePath = path.join(libDir, "hooks.ts");
    const content = `import { useState, useCallback, useEffect, useRef } from "react";
import { runtime } from "./runtime-instance";
import * as T from "./runtime-contract";

export function useOperation(operationId: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<T.NormalizedError | null>(null);
  const lastInputRef = useRef<any>({});
  const lastCtxRef = useRef<T.OperationContext>({ kind: "system", reason: "hook" });

  const execute = useCallback(async (input: any = {}, ctx: T.OperationContext = { kind: "system", reason: "hook" }) => {
    lastInputRef.current = input;
    lastCtxRef.current = ctx;
    setLoading(true);
    setError(null);
    try {
      const result = await runtime.execute(operationId, input, ctx);
      if (result.ok) {
        setData(result.data);
        return result;
      } else {
        setError(result.error || { code: "UNKNOWN_ERROR", message: "Failed" } as any);
        return result;
      }
    } finally {
      setLoading(false);
    }
  }, [operationId]);

  useEffect(() => {
    const unsubscribe = runtime.on("invalidate", (payload: any) => {
      const targets = payload?.targets ?? [];
      const hit = Array.isArray(targets) && targets.some((t: any) => {
        if (!t) return false;
        if (t.operationId && t.operationId === operationId) return true;
        if (t.kind === "operation" && t.operationId === operationId) return true;
        return false;
      });
      if (hit) {
        execute(lastInputRef.current, lastCtxRef.current);
      }
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [operationId, execute]);

  return { data, loading, error, execute };
}

export function useResource(resourceId: string) {
  const res = runtime.getDataSource(resourceId); // this is just a placeholder for finding the resource
  return {
      list: useOperation(\`\${resourceId}.list\`),
      get: useOperation(\`\${resourceId}.get\`),
      create: useOperation(\`\${resourceId}.create\`),
      update: useOperation(\`\${resourceId}.update\`),
      delete: useOperation(\`\${resourceId}.delete\`),
  };
}
`;
    project.createSourceFile(filePath, content, { overwrite: true });
}
