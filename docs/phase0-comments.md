```ts
/**
 * Frontend Core — Runtime Contract v0 (Phase 0)
 * Goal: operation-oriented, backend-agnostic, headless runtime.
 *
 * This file is a “constitution”: interfaces + minimal examples (3 acceptance drivers).
 *
 * NOTE:
 * - These types are meant to live in core (e.g. src/ir/frontend-contract.ts),
 *   and be emitted into generated apps as `src/lib/runtime-contract.ts` (or compiled into runtime.ts).
 * - UI is NOT described here. UI consumes these specs via hooks.
 */

/* --------------------------------------------
 * 1) Fundamental Types
 * ------------------------------------------ */

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type ResponseType = "json" | "text" | "html" | "blob";
export type BodyType = "none" | "json" | "text" | "multipart" | "formUrlEncoded";

export type Dict<T = unknown> = Record<string, T>;

export type PathParams = Record<string, string | number>;
export type QueryParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Where an operation is invoked from (helps for outcome / UX policies, but remains headless).
 */
export type OperationContext =
  | { kind: "page"; pageId: string }
  | { kind: "tableRow"; pageId: string; rowId: string }
  | { kind: "tableBulk"; pageId: string; selectedIds: string[] }
  | { kind: "form"; pageId: string; formId: string }
  | { kind: "system"; reason: string };

/* --------------------------------------------
 * 2) Normalized Error (single internal format)
 * ------------------------------------------ */

export type NormalizedErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "INTERNAL_ERROR"
  | "UNKNOWN_ERROR";

export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

export interface NormalizedError {
  code: NormalizedErrorCode;
  message: string;
  status?: number; // HTTP status if known
  details?: Dict; // any extra structured details
  fieldErrors?: FieldError[]; // for forms
  cause?: unknown; // original error (not for UI)
  raw?: unknown; // raw payload (not for UI)
}

/* --------------------------------------------
 * 3) DataSource & Auth
 * ------------------------------------------ */

/**
 * Auth state is per DataSource.
 */
export type AuthState =
  | { status: "anonymous" }
  | { status: "authenticated"; user?: Dict; roles?: string[] }
  | { status: "error"; error: NormalizedError };

export type AuthStrategyId = string;

export interface AuthStrategy {
  id: AuthStrategyId;

  /**
   * Attach auth to a request.
   * For cookie session, this often means setting `credentials: "include"` and nothing else.
   * For bearer token, attach Authorization header.
   */
  attach(req: RuntimeRequest, ds: DataSourceRuntimeConfig): Promise<RuntimeRequest>;

  /**
   * Optional: attempt to load/refresh auth state (e.g., call /me, refresh token).
   */
  loadState?: (rt: Runtime, dsId: string) => Promise<AuthState>;

  /**
   * Optional: login/logout operations might be declared as operations, but strategy can provide helpers.
   */
  onLoginSuccess?: (rt: Runtime, dsId: string, payload: unknown) => Promise<void>;
  onLogout?: (rt: Runtime, dsId: string) => Promise<void>;
}

export type CsrfStrategyId = string;

export interface CsrfStrategy {
  id: CsrfStrategyId;

  /**
   * Provide CSRF header (or other token) for state-changing requests.
   */
  attach(req: RuntimeRequest, rt: Runtime, dsId: string): Promise<RuntimeRequest>;
}

export interface DataSourceRuntimeConfig {
  id: string;
  baseUrl: string; // can be overridden at runtime (config)
  defaultHeaders?: Record<string, string>;
  withCredentials?: boolean; // for cookie-based auth
  timeoutMs?: number;
  authStrategyId?: AuthStrategyId;
  csrfStrategyId?: CsrfStrategyId;

  /**
   * Capability hints (for warnings / defaults / golden tests), not for blocking.
   */
  capabilities?: {
    supportsCookies?: boolean;
    supportsCsrf?: boolean;
    supportsMultipart?: boolean;
    supportsStreaming?: boolean; // SSE future
  };
}

/* --------------------------------------------
 * 4) Envelope Adapters & Pagination Adapters
 * ------------------------------------------ */

export type EnvelopeAdapterId = string;

/**
 * Converts raw response payload into a standard shape for the runtime.
 * IMPORTANT: keep it small — DO NOT put normalization logic here.
 */
export interface EnvelopeAdapter {
  id: EnvelopeAdapterId;

  extractData: (payload: unknown) => unknown;
  extractMeta?: (payload: unknown) => unknown;

  /**
   * Extract error payload (application-level error), if the backend returns errors in-body.
   * HTTP errors still pass through error normalizer.
   */
  extractErrorPayload?: (payload: unknown) => unknown;
}

export type PaginationAdapterId = string;

export interface PaginationResult {
  total?: number;
  nextCursor?: string;
  prevCursor?: string;
}

export interface PaginationAdapter {
  id: PaginationAdapterId;
  extract: (payload: unknown) => PaginationResult;
}

/* --------------------------------------------
 * 5) Request Body Spec & Response Spec
 * ------------------------------------------ */

export interface RequestBodySpec {
  type: BodyType;

  /**
   * Maps input/context into body.
   * - json/text/formUrlEncoded: returns serializable object/string
   * - multipart: returns FormData
   */
  build?: (input: unknown, ctx: OperationContext, rt: Runtime) => Promise<unknown>;

  /**
   * Optional override headers/accept/contentType.
   * Note: multipart should NOT set Content-Type manually (browser adds boundary).
   */
  contentType?: string;
  accept?: string;
}

export interface ResponseSpec {
  type: ResponseType;
  envelopeAdapterId?: EnvelopeAdapterId;
  paginationAdapterId?: PaginationAdapterId;

  /**
   * For blob response (downloads), optionally suggest filename.
   * Can also be handled via ResultHandlingSpec below.
   */
  filenameHint?: string;
}

/* --------------------------------------------
 * 6) Result Handling Spec (headless outcomes)
 * ------------------------------------------ */

export interface ToastSpec {
  kind: "success" | "info" | "warning" | "error";
  message: string;
}

export interface ResultHandlingSpec {
  /**
   * Cache invalidation targets (runtime-defined query keys or predicates).
   */
  invalidate?: Array<
    | { kind: "resourceList"; resourceId: string }
    | { kind: "resourceDetail"; resourceId: string; id: string }
    | { kind: "operation"; operationId: string }
    | { kind: "custom"; key: unknown }
  >;

  /**
   * Navigation / open link outcomes (UI chooses how).
   */
  redirectTo?: (result: OperationResultNormalized, rt: Runtime) => string | null;
  openUrl?: (result: OperationResultNormalized, rt: Runtime) => string | null;

  /**
   * Download handling (responseType=blob recommended).
   */
  downloadAs?: (result: OperationResultNormalized, rt: Runtime) => { filename: string } | null;

  /**
   * Toasts are “headless signals”; UI decides to show them.
   */
  toastOnSuccess?: ToastSpec;
  toastOnError?: ToastSpec;
}

/* --------------------------------------------
 * 7) OperationSpec (the atom)
 * ------------------------------------------ */

export interface OperationSpec {
  id: string;
  datasourceId: string;

  method: HttpMethod;
  path: string; // supports `:param` tokens (resolved via pathParams mapping)

  /**
   * Build request parameters (path/query/body/headers) from input/context.
   * Keep mapping functions small & deterministic.
   */
  pathParams?: (input: unknown, ctx: OperationContext, rt: Runtime) => Promise<PathParams>;
  query?: (input: unknown, ctx: OperationContext, rt: Runtime) => Promise<QueryParams>;
  headers?: (input: unknown, ctx: OperationContext, rt: Runtime) => Promise<Record<string, string>>;

  body?: RequestBodySpec;
  response: ResponseSpec;

  /**
   * Optional semantics for headless runtime to emit “signals”.
   */
  resultHandling?: ResultHandlingSpec;

  /**
   * Whether this operation requires auth state; route guards are separate,
   * but operation may enforce for safety.
   */
  requiresAuth?: boolean;
  requiredRoles?: string[];
}

/* --------------------------------------------
 * 8) ResourceSpec (sugar layer, derived or declared)
 * ------------------------------------------ */

export interface ResourceSpec {
  id: string;
  datasourceId: string;
  idField?: string;

  listOpId?: string;
  getOpId?: string;
  createOpId?: string;
  updateOpId?: string;
  deleteOpId?: string;

  /**
   * Envelope/pagination can be per operation, but resource may provide defaults.
   */
}

/* --------------------------------------------
 * 9) Runtime Request/Response (internal)
 * ------------------------------------------ */

export interface RuntimeRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: unknown;
  credentials?: RequestCredentials; // "include" for cookie session
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
  raw?: unknown; // raw payload (not for UI)
}

export interface Runtime {
  /**
   * Resolve datasource config (supports runtime overrides).
   */
  getDataSource(dsId: string): DataSourceRuntimeConfig;

  /**
   * Auth state per datasource
   */
  getAuthState(dsId: string): AuthState;

  /**
   * Execute an operation (the core primitive).
   */
  execute(operationId: string, input: unknown, ctx: OperationContext): Promise<OperationResultNormalized>;

  /**
   * Optional: cache invalidation hooks called by resultHandling.invalidate.
   */
  invalidate?(targets: ResultHandlingSpec["invalidate"]): void;
}

/* --------------------------------------------
 * 10) Registries (extension points)
 * ------------------------------------------ */

export interface Registry<T> {
  register(item: T): void;
  get(id: string): T | undefined;
  require(id: string): T;
}

export interface RuntimeRegistries {
  authStrategies: Registry<AuthStrategy>;
  csrfStrategies: Registry<CsrfStrategy>;
  envelopeAdapters: Registry<EnvelopeAdapter>;
  paginationAdapters: Registry<PaginationAdapter>;
}

/* --------------------------------------------
 * 11) Examples (3 Acceptance Drivers + micro driver)
 * ------------------------------------------ */

/**
 * Example Envelope: { ok: true, data: ..., meta: ... }
 */
export const envelope_ok_data_meta: EnvelopeAdapter = {
  id: "ok_data_meta",
  extractData: (p: any) => (p && typeof p === "object" ? p.data : undefined),
  extractMeta: (p: any) => (p && typeof p === "object" ? p.meta : undefined),
  extractErrorPayload: (p: any) => (p && typeof p === "object" ? p.error : undefined),
};

/**
 * Example Envelope: { items: [...], nextCursor: "..." }
 */
export const envelope_items_cursor: EnvelopeAdapter = {
  id: "items_cursor",
  extractData: (p: any) => (p && typeof p === "object" ? p.items : undefined),
  extractMeta: (p: any) => (p && typeof p === "object" ? p.meta : undefined),
  extractErrorPayload: (p: any) => (p && typeof p === "object" ? p.error : undefined),
};

export const pagination_cursor_from_root: PaginationAdapter = {
  id: "cursor_root",
  extract: (p: any) =>
    p && typeof p === "object"
      ? { nextCursor: typeof p.nextCursor === "string" ? p.nextCursor : undefined }
      : {},
};

/**
 * Auth Strategy: cookie session (common for PHP shared hosting).
 */
export const auth_cookie_session: AuthStrategy = {
  id: "cookieSession",
  attach: async (req, ds) => {
    return {
      ...req,
      credentials: ds.withCredentials ? "include" : req.credentials,
    };
  },
};

/**
 * Auth Strategy: bearer token
 */
export const auth_bearer_token = (getToken: () => Promise<string | null>): AuthStrategy => ({
  id: "bearerToken",
  attach: async (req) => {
    const token = await getToken();
    if (!token) return req;
    return {
      ...req,
      headers: { ...req.headers, Authorization: `Bearer ${token}` },
    };
  },
});

/**
 * CSRF strategy: fetch token endpoint once (simplified).
 * In real runtime, you'd cache & refresh token.
 */
export const csrf_fetch_token = (tokenEndpointPath: string): CsrfStrategy => ({
  id: "csrfFetchToken",
  attach: async (req, rt, dsId) => {
    // Only attach for unsafe methods
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return req;

    const ds = rt.getDataSource(dsId);
    const url = `${ds.baseUrl}${tokenEndpointPath}`;
    // NOTE: this is spec-level; actual runtime must use its request function (not fetch directly here).
    // We'll leave it as conceptual.
    const token = "SPEC_TOKEN"; // placeholder
    return { ...req, headers: { ...req.headers, "X-CSRF-Token": token } };
  },
});

/* --------------------------------------------
 * Driver #1 — Command-Oriented Workflow (Publisher)
 * ------------------------------------------ */

export const ds_publisher: DataSourceRuntimeConfig = {
  id: "publisher",
  baseUrl: "/admin-api",
  withCredentials: true,
  authStrategyId: "cookieSession",
  csrfStrategyId: "csrfFetchToken",
  capabilities: { supportsCookies: true, supportsCsrf: true, supportsMultipart: true },
};

export const op_list_posts: OperationSpec = {
  id: "publisher.listPosts",
  datasourceId: "publisher",
  method: "GET",
  path: "/posts",
  response: { type: "json", envelopeAdapterId: "ok_data_meta" },
  requiresAuth: true,
};

export const op_get_post_raw: OperationSpec = {
  id: "publisher.getPostRaw",
  datasourceId: "publisher",
  method: "GET",
  path: "/posts/:slug",
  pathParams: async (input) => {
    const { slug } = input as any;
    return { slug };
  },
  // raw markdown as text
  response: { type: "text" },
  requiresAuth: true,
};

export const op_save_post_raw: OperationSpec = {
  id: "publisher.savePostRaw",
  datasourceId: "publisher",
  method: "PUT",
  path: "/posts/:slug",
  pathParams: async (input) => ({ slug: (input as any).slug }),
  body: {
    type: "text",
    contentType: "text/plain; charset=utf-8",
    build: async (input) => (input as any).markdown as string,
  },
  response: { type: "json", envelopeAdapterId: "ok_data_meta" },
  resultHandling: {
    invalidate: [{ kind: "operation", operationId: "publisher.listPosts" }],
    toastOnSuccess: { kind: "success", message: "Draft saved." },
  },
  requiresAuth: true,
};

export const op_publish_post: OperationSpec = {
  id: "publisher.publishPost",
  datasourceId: "publisher",
  method: "POST",
  path: "/posts/:slug/publish",
  pathParams: async (input) => ({ slug: (input as any).slug }),
  body: { type: "none" },
  response: { type: "json", envelopeAdapterId: "ok_data_meta" },
  resultHandling: {
    invalidate: [{ kind: "operation", operationId: "publisher.listPosts" }],
    toastOnSuccess: { kind: "success", message: "Published." },
  },
  requiresAuth: true,
};

export const op_preview_post: OperationSpec = {
  id: "publisher.previewPost",
  datasourceId: "publisher",
  method: "POST",
  path: "/posts/:slug/preview",
  pathParams: async (input) => ({ slug: (input as any).slug }),
  body: {
    type: "text",
    contentType: "text/plain; charset=utf-8",
    build: async (input) => (input as any).markdown as string,
  },
  response: { type: "html" }, // returns HTML string
  resultHandling: {
    openUrl: (result) => {
      // Two possible patterns:
      // 1) backend returns a temp URL in JSON (then responseType should be json)
      // 2) backend returns raw HTML: UI can open a new tab with Blob URL (UI-level).
      // Here we keep it headless; UI decides how to present html.
      return null;
    },
    toastOnSuccess: { kind: "info", message: "Preview generated." },
  },
  requiresAuth: true,
};

export const op_upload_media: OperationSpec = {
  id: "publisher.uploadMedia",
  datasourceId: "publisher",
  method: "POST",
  path: "/media",
  body: {
    type: "multipart",
    build: async (input) => {
      const { file } = input as any;
      const fd = new FormData();
      fd.append("file", file);
      return fd;
    },
  },
  response: { type: "json", envelopeAdapterId: "ok_data_meta" },
  resultHandling: {
    toastOnSuccess: { kind: "success", message: "Media uploaded." },
  },
  requiresAuth: true,
};

/* --------------------------------------------
 * Driver #2 — Generic Business CRUD (Members)
 * ------------------------------------------ */

export const ds_internal: DataSourceRuntimeConfig = {
  id: "internal",
  baseUrl: "/api",
  withCredentials: true,
  authStrategyId: "cookieSession",
  capabilities: { supportsCookies: true },
};

export const op_members_list: OperationSpec = {
  id: "internal.members.list",
  datasourceId: "internal",
  method: "GET",
  path: "/members",
  query: async (input) => {
    const { search, page, limit } = (input as any) || {};
    return { search, page, limit };
  },
  response: { type: "json", envelopeAdapterId: "ok_data_meta" },
  requiresAuth: true,
};

export const op_members_get: OperationSpec = {
  id: "internal.members.get",
  datasourceId: "internal",
  method: "GET",
  path: "/members/:id",
  pathParams: async (input) => ({ id: (input as any).id }),
  response: { type: "json", envelopeAdapterId: "ok_data_meta" },
  requiresAuth: true,
};

export const op_members_create: OperationSpec = {
  id: "internal.members.create",
  datasourceId: "internal",
  method: "POST",
  path: "/members",
  body: {
    type: "json",
    build: async (input) => (input as any),
  },
  response: { type: "json", envelopeAdapterId: "ok_data_meta" },
  resultHandling: {
    invalidate: [{ kind: "operation", operationId: "internal.members.list" }],
    toastOnSuccess: { kind: "success", message: "Member created." },
    toastOnError: { kind: "error", message: "Failed to create member." },
  },
  requiresAuth: true,
};

export const op_members_update: OperationSpec = {
  id: "internal.members.update",
  datasourceId: "internal",
  method: "PUT",
  path: "/members/:id",
  pathParams: async (input) => ({ id: (input as any).id }),
  body: {
    type: "json",
    build: async (input) => {
      const { id, ...rest } = input as any;
      return rest;
    },
  },
  response: { type: "json", envelopeAdapterId: "ok_data_meta" },
  resultHandling: {
    invalidate: [
      { kind: "operation", operationId: "internal.members.list" },
      { kind: "operation", operationId: "internal.members.get" },
    ],
    toastOnSuccess: { kind: "success", message: "Member updated." },
  },
  requiresAuth: true,
};

export const op_members_delete: OperationSpec = {
  id: "internal.members.delete",
  datasourceId: "internal",
  method: "DELETE",
  path: "/members/:id",
  pathParams: async (input) => ({ id: (input as any).id }),
  body: { type: "none" },
  response: { type: "json", envelopeAdapterId: "ok_data_meta" },
  resultHandling: {
    invalidate: [{ kind: "operation", operationId: "internal.members.list" }],
    toastOnSuccess: { kind: "success", message: "Member deleted." },
  },
  requiresAuth: true,
};

/**
 * Optional sugar resource (can be derived in lowering, not necessary to author)
 */
export const resource_members: ResourceSpec = {
  id: "members",
  datasourceId: "internal",
  listOpId: "internal.members.list",
  getOpId: "internal.members.get",
  createOpId: "internal.members.create",
  updateOpId: "internal.members.update",
  deleteOpId: "internal.members.delete",
};

/* --------------------------------------------
 * Driver #3 — Third-Party API (absolute URL, bearer, cursor envelope)
 * ------------------------------------------ */

export const ds_thirdparty: DataSourceRuntimeConfig = {
  id: "thirdparty",
  baseUrl: "https://api.example.com/v1",
  withCredentials: false,
  authStrategyId: "bearerToken",
  capabilities: { supportsCookies: false },
};

export const op_tp_search: OperationSpec = {
  id: "tp.search",
  datasourceId: "thirdparty",
  method: "GET",
  path: "/search",
  query: async (input) => {
    const { q, cursor, limit } = (input as any) || {};
    return { q, cursor, limit };
  },
  response: {
    type: "json",
    envelopeAdapterId: "items_cursor",
    paginationAdapterId: "cursor_root",
  },
  requiresAuth: true, // requires bearer
};

/* --------------------------------------------
 * Micro-driver — Mixed response types
 * ------------------------------------------ */

export const op_tp_download_report: OperationSpec = {
  id: "tp.downloadReport",
  datasourceId: "thirdparty",
  method: "GET",
  path: "/reports/:id/download",
  pathParams: async (input) => ({ id: (input as any).id }),
  response: { type: "blob", filenameHint: "report.pdf" },
  resultHandling: {
    downloadAs: () => ({ filename: "report.pdf" }),
  },
  requiresAuth: true,
};

/* --------------------------------------------
 * 12) Minimal “Operation Catalog” (what TargetIR would carry)
 * ------------------------------------------ */

export interface OperationCatalog {
  datasources: DataSourceRuntimeConfig[];
  operations: OperationSpec[];
  resources?: ResourceSpec[];

  envelopeAdapters: EnvelopeAdapter[];
  paginationAdapters: PaginationAdapter[];

  /**
   * Auth strategies are runtime-registered (built-in + extension).
   * In TargetIR you may only reference by id; strategy implementation lives in runtime.
   */
}

export const catalog_example: OperationCatalog = {
  datasources: [ds_publisher, ds_internal, ds_thirdparty],
  operations: [
    op_list_posts,
    op_get_post_raw,
    op_save_post_raw,
    op_publish_post,
    op_preview_post,
    op_upload_media,
    op_members_list,
    op_members_get,
    op_members_create,
    op_members_update,
    op_members_delete,
    op_tp_search,
    op_tp_download_report,
  ],
  resources: [resource_members],
  envelopeAdapters: [envelope_ok_data_meta, envelope_items_cursor],
  paginationAdapters: [pagination_cursor_from_root],
};
```

Di atas sudah mencakup “konstitusi” Phase 0:

* **OperationSpec** sebagai atom
* **RequestBodySpec** (`json/text/multipart/none`) + **ResponseSpec** (`json/text/html/blob`)
* **ResultHandlingSpec** (invalidate/redirect/open/download/toast) tanpa UI coupling
* **DataSource-centric auth** (auth per datasource)
* **EnvelopeAdapter** terpisah dari **PaginationAdapter**
* **NormalizedError** format tunggal
