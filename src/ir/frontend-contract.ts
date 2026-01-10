/**
 * Frontend Core — Runtime Contract v0 (Phase 0)
 * Goal: operation-oriented, backend-agnostic, headless runtime.
 */

/* --------------------------------------------
 * 1) Fundamental Types
 * ------------------------------------------ */

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

/* --------------------------------------------
 * 2) Normalized Error
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
    status?: number;
    details?: Dict;
    fieldErrors?: FieldError[];
    cause?: unknown;
    raw?: unknown;
}

/* --------------------------------------------
 * 3) DataSource & Auth
 * ------------------------------------------ */

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
    capabilities?: {
        supportsCookies?: boolean;
        supportsCsrf?: boolean;
        supportsMultipart?: boolean;
        supportsStreaming?: boolean;
    };
}

/* --------------------------------------------
 * 4) Envelope Adapters & Pagination Adapters
 * ------------------------------------------ */

export type EnvelopeAdapterId = string;

export interface EnvelopeAdapter {
    id: EnvelopeAdapterId;
    extractData: (payload: unknown) => unknown;
    extractMeta?: (payload: unknown) => unknown;
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
    build?: (input: unknown, ctx: OperationContext, rt: Runtime) => Promise<unknown>;
    contentType?: string;
    accept?: string;
}

export interface ResponseSpec {
    type: ResponseType;
    envelopeAdapterId?: EnvelopeAdapterId;
    paginationAdapterId?: PaginationAdapterId;
    filenameHint?: string;
}

/* --------------------------------------------
 * 6) Result Handling Spec
 * ------------------------------------------ */

export interface ToastSpec {
    kind: "success" | "info" | "warning" | "error";
    message: string;
}

export interface ResultHandlingSpec {
    invalidate?: Array<
        | { kind: "resourceList"; resourceId: string }
        | { kind: "resourceDetail"; resourceId: string; id: string }
        | { kind: "operation"; operationId: string }
        | { kind: "custom"; key: unknown }
    >;
    redirectTo?: (result: OperationResultNormalized, rt: Runtime) => string | null;
    openUrl?: (result: OperationResultNormalized, rt: Runtime) => string | null;
    downloadAs?: (result: OperationResultNormalized, rt: Runtime) => { filename: string } | null;
    toastOnSuccess?: ToastSpec;
    toastOnError?: ToastSpec;
}

/* --------------------------------------------
 * 7) OperationSpec
 * ------------------------------------------ */

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

/* --------------------------------------------
 * 8) ResourceSpec
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
}

/* --------------------------------------------
 * 9) Runtime Request/Response
 * ------------------------------------------ */

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
    invalidate?(targets: ResultHandlingSpec["invalidate"]): void;
}
