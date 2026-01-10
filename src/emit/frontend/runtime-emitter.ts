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

      return result;
    } catch (err: any) {
      return { ok: false, error: { code: "INTERNAL_ERROR", message: err.message, cause: err } };
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
      // hook for UI-level cache invalidation
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
  { auth: {}, csrf: {} }
);

(runtime as any).evalLogic = (logic: any, fallback: any, ctx: any) => {
    return logic; 
};
`;
    project.createSourceFile(filePath, content, { overwrite: true });
}

function emitRuntimeHooks(project: Project, libDir: string) {
    const filePath = path.join(libDir, "hooks.ts");
    const content = `import { useState, useCallback } from "react";
import { runtime } from "./runtime-instance";
import * as T from "./runtime-contract";

export function useOperation(operationId: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<T.NormalizedError | null>(null);

  const execute = useCallback(async (input: any = {}, ctx: T.OperationContext = { kind: "system", reason: "hook" }) => {
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
