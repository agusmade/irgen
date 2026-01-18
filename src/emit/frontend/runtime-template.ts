import type {
    Runtime,
    OperationSpec,
    OperationContext,
    OperationResultNormalized,
    DataSourceRuntimeConfig,
    AuthState,
    NormalizedError,
    NormalizedErrorCode,
    RuntimeRequest,
    EnvelopeAdapter,
    PaginationAdapter,
} from "../../ir/frontend-contract.js";

/**
 * Headless Runtime Implementation (Phase 0 Prototype)
 */
export class BaseRuntime implements Runtime {
    private authStates: Record<string, AuthState> = {};
    private text: Record<string, string> = {};

    constructor(
        private datasources: DataSourceRuntimeConfig[],
        private operations: OperationSpec[],
        private adapters: {
            envelope: EnvelopeAdapter[];
            pagination: PaginationAdapter[];
        },
        private strategies: {
            auth: any; // Mapping of strategy ID to implementation
            csrf: any; // Mapping of strategy ID to implementation
        },
        runtimeText: Record<string, string> = {}
    ) {
        this.text = runtimeText;
    }

    private t(key: string, fallback: string): string {
        return this.text[key] || fallback;
    }

    getDataSource(dsId: string): DataSourceRuntimeConfig {
        const ds = this.datasources.find((d) => d.id === dsId);
        if (!ds) throw new Error(this.t("errors.dataSourceNotFound", `DataSource not found: ${dsId}`));
        return ds;
    }

    getAuthState(dsId: string): AuthState {
        return this.authStates[dsId] || { status: "anonymous" };
    }

    setAuthState(dsId: string, state: AuthState) {
        this.authStates[dsId] = state;
    }

    async execute(
        operationId: string,
        input: unknown,
        ctx: OperationContext
    ): Promise<OperationResultNormalized> {
        const op = this.operations.find((o) => o.id === operationId);
        if (!op) throw new Error(this.t("errors.operationNotFound", `Operation not found: ${operationId}`));

        const ds = this.getDataSource(op.datasourceId);

        try {
            // 1. Build initial request
            let url = `${ds.baseUrl}${op.path}`;

            // Resolve path params
            if (op.pathParams) {
                const params = await op.pathParams(input, ctx, this);
                for (const [key, val] of Object.entries(params)) {
                    url = url.replace(`:${key}`, String(val));
                }
            }

            // Resolve query params
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
                // Note: multipart (FormData) let fetch set the content-type with boundary
            }

            if (op.response.type === "json") {
                headers["Accept"] = op.response.envelopeAdapterId ? "application/json" : "*/*";
            }

            let req: RuntimeRequest = {
                url,
                method: op.method,
                headers,
                body,
                credentials: ds.withCredentials ? "include" : undefined,
                responseType: op.response.type,
            };

            // 2. Apply Auth Strategy
            if (ds.authStrategyId) {
                const strategy = this.strategies.auth[ds.authStrategyId];
                if (strategy) {
                    req = await strategy.attach(req, ds);
                }
            }

            // 3. Apply CSRF Strategy
            if (ds.csrfStrategyId) {
                const strategy = this.strategies.csrf[ds.csrfStrategyId];
                if (strategy) {
                    req = await strategy.attach(req, this, ds.id);
                }
            }

            // 4. Perform Fetch
            const response = await fetch(req.url, {
                method: req.method,
                headers: req.headers,
                body: req.body as any,
                credentials: req.credentials,
                signal: req.signal,
            });

            // 5. Build Result
            const result: OperationResultNormalized = {
                ok: response.ok,
                status: response.status,
            };

            if (!response.ok) {
                result.error = await this.normalizeError(response);
                return result;
            }

            // 6. Parse and Normalize Response
            let rawPayload: any;
            if (op.response.type === "json") {
                rawPayload = await response.json();
            } else if (op.response.type === "text" || op.response.type === "html") {
                rawPayload = await response.text();
            } else if (op.response.type === "blob") {
                rawPayload = await response.blob();
            }

            result.raw = rawPayload;

            // Apply Envelope Adapter
            if (op.response.envelopeAdapterId) {
                const adapter = this.adapters.envelope.find((a) => a.id === op.response.envelopeAdapterId);
                if (adapter) {
                    result.data = adapter.extractData(rawPayload);
                    result.meta = adapter.extractMeta?.(rawPayload);

                    const errorPayload = adapter.extractErrorPayload?.(rawPayload);
                    if (errorPayload) {
                        result.ok = false;
                        result.error = this.normalizePayloadError(errorPayload, response.status);
                    }
                } else {
                    result.data = rawPayload;
                }
            } else {
                result.data = rawPayload;
            }

            // Apply Pagination Adapter
            if (op.response.paginationAdapterId) {
                const adapter = this.adapters.pagination.find((a) => a.id === op.response.paginationAdapterId);
                if (adapter) {
                    result.pagination = adapter.extract(rawPayload);
                }
            }

            // 7. Handle Outcomes (Toasts, Invalidations, etc. - usually delegated to UI hooks but runtime can signal)
            if (result.ok && op.resultHandling) {
                this.handleResultSignals(op.resultHandling, result);
            }

            return result;
        } catch (err: any) {
            return {
                ok: false,
                error: this.normalizeException(err),
            };
        }
    }

    private async normalizeError(response: Response): Promise<NormalizedError> {
        const status = response.status;
        let code: NormalizedErrorCode = "INTERNAL_ERROR";
        let message = response.statusText;

        if (status === 401) code = "UNAUTHORIZED";
        else if (status === 403) code = "FORBIDDEN";
        else if (status === 404) code = "NOT_FOUND";
        else if (status === 422) code = "VALIDATION_ERROR";
        else if (status === 409) code = "CONFLICT";
        else if (status === 429) code = "RATE_LIMITED";

        let details: any = {};
        try {
            const payload = await response.json();
            message = payload.message || message;
            details = payload;
        } catch (_) { }

        return { code, message, status, details };
    }

    private normalizePayloadError(payload: any, status?: number): NormalizedError {
        return {
            code: "UNKNOWN_ERROR",
            message: typeof payload === "string" ? payload : (payload.message || this.t("errors.operationFailed", "Operation failed")),
            details: payload,
            status,
        };
    }

    private normalizeException(err: any): NormalizedError {
        if (err.name === "AbortError") return { code: "TIMEOUT", message: this.t("errors.timeout", "Request timed out") };
        if (err instanceof TypeError) return { code: "NETWORK_ERROR", message: this.t("errors.network", "Network error or CORS issue") };
        return {
            code: "INTERNAL_ERROR",
            message: err.message || this.t("errors.unexpected", "An unexpected error occurred"),
            cause: err,
        };
    }

    private listeners: Record<string, Function[]> = {};

    on(event: string, fn: Function) {
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

    private async handleResultSignals(spec: any, result: OperationResultNormalized) {
        const ctx: any = {}; // TODO: populate context if needed

        // 1. Invalidate
        if (spec.invalidate && typeof this.invalidate === "function") {
            this.invalidate(spec.invalidate);
        }

        // 2. Toast
        if (result.ok && spec.toastOnSuccess) {
            this.emit("toast", { kind: spec.toastOnSuccess.kind, message: spec.toastOnSuccess.message });
        } else if (!result.ok && spec.toastOnError) {
            this.emit("toast", { kind: spec.toastOnError.kind, message: spec.toastOnError.message });
        }

        // 3. Redirect
        if (result.ok && spec.redirectTo) {
            // Note: serializeLogic generates async functions, so we await them
            // The generated code looks like: async (input, ctx, rt) => ...
            // But spec.redirectTo might be the serialized function itself or a raw value
            // We'll treat it as a function if it is one, otherwise use simpler evaluation
            let url: string | null = null;
            if (typeof spec.redirectTo === 'function') {
                url = await spec.redirectTo(result, ctx, this);
            } else {
                url = String(spec.redirectTo);
            }

            if (url) {
                this.emit("navigate", { to: url });
                if (typeof window !== 'undefined') {
                    const nav = (window as any).__IRGEN_NAVIGATE__;
                    if (typeof nav === 'function') {
                        nav(String(url));
                    } else if (!(window as any).__SPA_ROUTER__) {
                        const base = (window as any).__IRGEN_BASE_PATH__ || '';
                        const target = (typeof url === 'string' && url.startsWith('/') && base && base !== '/')
                            ? String(base).replace(/\/$/, '') + String(url)
                            : String(url);
                        window.location.assign(target);
                    }
                }
            }
        }

        // 4. Open URL
        if (result.ok && spec.openUrl) {
            let url: string | null = null;
            if (typeof spec.openUrl === 'function') {
                url = await spec.openUrl(result, ctx, this);
            } else {
                url = String(spec.openUrl);
            }

            if (url) {
                this.emit("openUrl", { url });
                if (typeof window !== 'undefined') {
                    window.open(url, '_blank');
                }
            }
        }

        // 5. Download
        if (result.ok && spec.downloadAs) {
            let opts: any = null;
            if (typeof spec.downloadAs === 'function') {
                opts = await spec.downloadAs(result, ctx, this);
            } else {
                opts = spec.downloadAs;
            }

            if (opts && opts.filename) {
                // Handle blob download if data is blob, or json download
                // This logic is best handled by the component hook, but we emit the signal
                this.emit("download", { filename: opts.filename, data: result.data, raw: result.raw });
            }
        }
    }

    evalLogic(logic: any, ctx: any, input: any): any {
        // Basic Logic Evaluation implementation
        // For C3 patch, we assume logic is pre-compiled into JS functions by the emitter serializer
        // If logic is passed as raw JSON Logic (not yet implemented in emitter), we would evaluate it here.
        // For now, identity or simple property access.
        return logic;
    }

    invalidate(targets: any): void {
        // Implementation for cache invalidation (e.g. TanStack Query integration)
        this.emit("invalidate", targets);
    }
}
